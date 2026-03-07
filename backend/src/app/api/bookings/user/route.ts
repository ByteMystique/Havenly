import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { corsHeaders } from "@/lib/cors"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const user_id = searchParams.get("user_id")

  if (!user_id) {
    return NextResponse.json(
      { success: false, error: "user_id required" },
      { status: 400, headers: corsHeaders }
    )
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", user_id)

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
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}