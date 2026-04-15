import { NextResponse } from "next/server"
import { supabase, getUser } from "@/lib/auth"
import { corsHeaders } from "@/lib/cors"

// GET /api/bookings/owner — all bookings for the owner's hostels
export async function GET(req: Request) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })

  // Get all hostel IDs owned by this user
  const { data: hostels, error: hostelErr } = await supabase
    .from("hostels")
    .select("id")
    .eq("owner_id", user.id)

  if (hostelErr) return NextResponse.json({ error: hostelErr.message }, { status: 500, headers: corsHeaders })

  const hostelIds = (hostels || []).map((h: any) => h.id)

  if (hostelIds.length === 0) return NextResponse.json({ data: [] }, { headers: corsHeaders })

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .in("hostel_id", hostelIds)
    .order("booked_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  return NextResponse.json({ data }, { headers: corsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}
