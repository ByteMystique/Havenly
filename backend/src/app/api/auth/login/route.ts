import { NextResponse } from "next/server"
import { supabase } from "@/lib/auth"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(req: Request) {
  const { email, password } = await req.json()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401, headers: corsHeaders })
  }

  // Fetch role from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single()

  const role = profile?.role || "student"

  return NextResponse.json({
    session: {
      ...data.session,
      user: {
        ...data.session.user,
        user_metadata: {
          ...data.session.user.user_metadata,
          role,
        },
      },
    },
    role,
  }, { headers: corsHeaders })
}
