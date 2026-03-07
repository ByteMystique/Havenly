import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { corsHeaders } from "@/lib/cors"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders }
    )
  }

  return NextResponse.json(
    { success: true },
    { headers: corsHeaders }
  )
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}