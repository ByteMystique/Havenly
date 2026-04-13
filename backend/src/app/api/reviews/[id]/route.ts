import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { corsHeaders } from "@/lib/cors"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUser(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return null
  const { data: { user } } = await supabase.auth.getUser(token)
  return user
}

// PUT /api/reviews/:id — update own review
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders })

  const body = await req.json()
  const { rating, text, categoryRatings } = body

  const { data, error } = await supabase
    .from("reviews")
    .update({ rating, text, category_ratings: categoryRatings, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders })
  return NextResponse.json({ success: true, data: data[0] }, { headers: corsHeaders })
}

// DELETE /api/reviews/:id — delete own review
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders })

  const { error } = await supabase.from("reviews").delete().eq("id", id).eq("user_id", user.id)
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders })
  return NextResponse.json({ success: true }, { headers: corsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}
