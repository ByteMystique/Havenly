import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { corsHeaders } from "@/lib/cors"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const { data, error } = await supabase
      .from("hostels")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404, headers: corsHeaders }
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