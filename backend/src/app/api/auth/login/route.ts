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

  return NextResponse.json(
  { session: data.session },
  { headers: corsHeaders }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}