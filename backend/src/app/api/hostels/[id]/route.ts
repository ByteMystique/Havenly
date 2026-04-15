import { NextResponse } from "next/server"
import { supabase, getUser } from "@/lib/auth"
import { corsHeaders } from "@/lib/cors"

// GET /api/hostels/:id
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabase.from("hostels").select("*, room_types(*)").eq("id", id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404, headers: corsHeaders })
  return NextResponse.json({ data }, { headers: corsHeaders })
}

// PUT /api/hostels/:id — update hostel (owner only)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })

  const body = await req.json()
  const { name, type, price, distance, description, address, image, amenities, scores, status } = body

  const updates: any = {}
  if (name !== undefined) updates.name = name
  if (type !== undefined) updates.type = type
  if (price !== undefined) updates.price = price
  if (distance !== undefined) updates.distance = distance
  if (description !== undefined) updates.description = description
  if (address !== undefined) updates.address = address
  if (image !== undefined) updates.image = image
  if (amenities !== undefined) updates.amenities = amenities
  if (scores !== undefined) updates.scores = scores
  if (status !== undefined) updates.status = status

  const { data, error } = await supabase.from("hostels").update(updates).eq("id", id).eq("owner_id", user.id).select("*, room_types(*)").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  return NextResponse.json({ data }, { headers: corsHeaders })
}

// DELETE /api/hostels/:id — delete hostel (owner only)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })

  const { error } = await supabase.from("hostels").delete().eq("id", id).eq("owner_id", user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  return NextResponse.json({ success: true }, { headers: corsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}