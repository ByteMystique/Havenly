import { NextResponse } from "next/server"
import { supabase } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// Admin client bypasses email confirmation
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(req: Request) {
  const { email, password, name, role } = await req.json()

  // Use admin.createUser to skip email confirmation
  const { data: adminData, error: adminErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,  // auto-confirm
    user_metadata: { full_name: name },
  })

  if (adminErr) {
    // Fallback to regular signup if admin fails (e.g. user exists)
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders })

    if (data.user) {
      await adminClient.from("profiles").upsert({
        id: data.user.id, email, full_name: name,
        university: "CUSAT", role: role || "student", preferences: {},
      })
    }
    return NextResponse.json({ session: data.session, user: data.user }, { headers: corsHeaders })
  }

  // Now sign in to get a session token
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email, password,
  })

  if (signInErr) {
    // Return user without session (still created)
    await adminClient.from("profiles").upsert({
      id: adminData.user.id, email, full_name: name,
      university: "CUSAT", role: role || "student", preferences: {},
    })
    return NextResponse.json({ session: null, user: adminData.user }, { headers: corsHeaders })
  }

  // Create profile with role
  await adminClient.from("profiles").upsert({
    id: adminData.user.id, email, full_name: name,
    university: "CUSAT", role: role || "student", preferences: {},
  })

  return NextResponse.json({
    session: signInData.session,
    user: adminData.user
  }, { headers: corsHeaders })
}
