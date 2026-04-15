import { NextResponse } from "next/server"
import { supabase, getUser } from "@/lib/auth"
import { corsHeaders } from "@/lib/cors"

// GET /api/hostels/mine — get owner's own hostels
export async function GET(req: Request) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })

  const { data, error } = await supabase
    .from("hostels")
    .select("*, room_types(*)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  return NextResponse.json({ data }, { headers: corsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}
