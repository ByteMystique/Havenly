import { NextResponse } from "next/server"
import { supabase, getUser } from "@/lib/auth"
import { corsHeaders } from "@/lib/cors"

// GET /api/hostels — list all active hostels (public)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("hostels")
      .select("*, room_types(*)")
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
    return NextResponse.json({ data }, { headers: corsHeaders })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500, headers: corsHeaders })
  }
}

// POST /api/hostels — create hostel (owner only)
export async function POST(req: Request) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })

  try {
    const body = await req.json()
    const { name, type, hostelType, price, distance, description, address, image, amenities, scores, roomTypes, safetyScore, foodQuality } = body

    // Map frontend hostelType (Gents/Ladies/Mixed) → DB type (boys/girls/co-ed)
    const typeMap: Record<string, string> = { 'Gents': 'boys', 'Ladies': 'girls', 'Mixed': 'co-ed' }
    const dbType = typeMap[hostelType] || type || 'boys'

    // Insert hostel
    const { data: hostel, error } = await supabase
      .from("hostels")
      .insert([{ owner_id: user.id, name, type: dbType, price, distance, description, address, image, amenities: amenities || [], scores: scores || {}, rating: 0, rating_count: 0, status: "active" }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })

    // Insert room types if provided
    if (roomTypes && roomTypes.length > 0) {
      const rows = roomTypes.map((rt: any) => ({
        id: `rt_${hostel.id}_${rt.type}`,
        hostel_id: hostel.id,
        type: rt.type,
        label: rt.label,
        price: rt.price,
        total_beds: rt.totalBeds || rt.total_beds || 10,
        occupied_beds: 0,
      }))
      await supabase.from("room_types").insert(rows)
    } else {
      // Default room types
      const base = price || 4000
      await supabase.from("room_types").insert([
        { id: `rt_${hostel.id}_single`, hostel_id: hostel.id, type: "single", label: "Single Room", price: Math.round(base * 1.4), total_beds: 10, occupied_beds: 0 },
        { id: `rt_${hostel.id}_double`, hostel_id: hostel.id, type: "double", label: "Double Sharing", price: base, total_beds: 20, occupied_beds: 0 },
        { id: `rt_${hostel.id}_triple`, hostel_id: hostel.id, type: "triple", label: "Triple Sharing", price: Math.round(base * 0.75), total_beds: 30, occupied_beds: 0 },
      ])
    }

    // Re-fetch with room types
    const { data: full } = await supabase.from("hostels").select("*, room_types(*)").eq("id", hostel.id).single()
    return NextResponse.json({ data: full }, { status: 201, headers: corsHeaders })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500, headers: corsHeaders })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}