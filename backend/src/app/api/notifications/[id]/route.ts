import { NextResponse } from "next/server"
import { supabase, getUser } from "@/lib/auth"
import { corsHeaders } from "@/lib/cors"

// PUT /api/notifications/:id — mark single notification as read
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })

  const body = await req.json().catch(() => ({}))
  const markAll = body.markAll === true

  if (markAll) {
    // Mark ALL notifications as read for this user
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
    return NextResponse.json({ success: true }, { headers: corsHeaders })
  }

  // Mark single notification as read
  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  return NextResponse.json({ data }, { headers: corsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}
