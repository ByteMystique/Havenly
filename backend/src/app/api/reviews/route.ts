import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { corsHeaders } from "@/lib/cors"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/reviews?hostel_id=X
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const hostel_id = searchParams.get("hostel_id")

  if (!hostel_id) {
    return NextResponse.json({ success: false, error: "hostel_id required" }, { status: 400, headers: corsHeaders })
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("hostel_id", hostel_id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders })
  }

  return NextResponse.json({ success: true, data }, { headers: corsHeaders })
}

// POST /api/reviews — create review (auth required, one per user per hostel)
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders })
  }

  const token = authHeader.replace("Bearer ", "")
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) {
    return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401, headers: corsHeaders })
  }

  const body = await req.json()
  const { hostelId, rating, text, categoryRatings } = body

  // Check one-per-user
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("hostel_id", hostelId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ success: false, error: "You have already reviewed this hostel" }, { status: 409, headers: corsHeaders })
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert([{
      hostel_id: hostelId,
      user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email?.split("@")[0],
      rating,
      text,
      category_ratings: categoryRatings,
    }])
    .select()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders })
  }

  return NextResponse.json({ success: true, data: data[0] }, { headers: corsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}
