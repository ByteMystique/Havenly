import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { corsHeaders } from "@/lib/cors";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

if (error) {
  return NextResponse.json(
    { error: error.message },
    { status: 401, headers: corsHeaders }
  );
}

// enforce email verification
if (!data.user?.email_confirmed_at) {
    return NextResponse.json(
      { error: "Please verify your email before logging in." },
      { status: 403, headers: corsHeaders }
    );
  }

  return NextResponse.json(
    {
      session: data.session,
      user: data.user
    },
    { headers: corsHeaders }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}