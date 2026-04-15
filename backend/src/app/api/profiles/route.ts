import { NextResponse } from "next/server"
import { supabase, getUser } from "@/lib/auth"
import { corsHeaders } from "@/lib/cors"

// GET /api/profiles — get logged-in user's profile
export async function GET(req: Request) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })

  let { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Auto-create profile if missing
  if (error && error.code === "PGRST116") {
    const newProfile = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split("@")[0],
      university: "CUSAT",
      role: "student",
      preferences: {},
    }
    const { data: created } = await supabase.from("profiles").insert([newProfile]).select().single()
    data = created
    error = null
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  return NextResponse.json({ data }, { headers: corsHeaders })
}

// PUT /api/profiles — update logged-in user's profile
export async function PUT(req: Request) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })

  const body = await req.json()
  const { full_name, phone, university, year_of_study, bio, avatar_url, role, preferences } = body

  const updates: any = {}
  if (full_name !== undefined) updates.full_name = full_name
  if (phone !== undefined) updates.phone = phone
  if (university !== undefined) updates.university = university
  if (year_of_study !== undefined) updates.year_of_study = year_of_study
  if (bio !== undefined) updates.bio = bio
  if (avatar_url !== undefined) updates.avatar_url = avatar_url
  if (role !== undefined) updates.role = role
  if (preferences !== undefined) updates.preferences = preferences

  // Upsert — creates if not exists, updates if it does
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, email: user.email, ...updates })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  return NextResponse.json({ data }, { headers: corsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}
