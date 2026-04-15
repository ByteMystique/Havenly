import { NextResponse } from "next/server"
import { supabase, getUser } from "@/lib/auth"
import { corsHeaders } from "@/lib/cors"

// GET /api/notifications — get all notifications for logged-in user
export async function GET(req: Request) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  return NextResponse.json({ data }, { headers: corsHeaders })
}

// POST /api/notifications — create a notification
export async function POST(req: Request) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })

  const body = await req.json()
  const { userId, type, title, message, link } = body

  const { data, error } = await supabase
    .from("notifications")
    .insert([{ user_id: userId || user.id, type, title, message, link }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  return NextResponse.json({ data }, { status: 201, headers: corsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}
