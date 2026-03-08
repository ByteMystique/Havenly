import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { corsHeaders } from "@/lib/cors"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { hostel_id, check_in, check_out, guests } = body

    // get authorization header
    const authHeader = req.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.replace("Bearer ", "")

    // validate user session with Supabase
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401, headers: corsHeaders }
      )
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert([
        {
          user_id: user.id,
          hostel_id,
          check_in,
          check_out,
          guests
        }
      ])
      .select()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data
      },
      { headers: corsHeaders }
    )

  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}