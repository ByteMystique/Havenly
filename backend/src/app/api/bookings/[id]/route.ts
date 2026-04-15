import { NextResponse } from "next/server"
import { supabase, getUser } from "@/lib/auth"
import { corsHeaders } from "@/lib/cors"

// PUT /api/bookings/:id — approve / reject / cancel
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })

  const { status } = await req.json()
  if (!["confirmed", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400, headers: corsHeaders })
  }

  // Load existing booking
  const { data: booking, error: fetchErr } = await supabase
    .from("bookings").select("*").eq("id", id).single()
  if (fetchErr || !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404, headers: corsHeaders })

  // Update status
  const { data, error } = await supabase
    .from("bookings").update({ status }).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })

  // Adjust room occupancy
  if (booking.room_type_id) {
    if (status === "confirmed" && booking.status === "pending") {
      await supabase.rpc("increment_occupied", { room_id: booking.room_type_id }).catch(() =>
        supabase.from("room_types")
          .update({ occupied_beds: supabase.rpc("coalesce_increment", {}) })
          .eq("id", booking.room_type_id)
      )
      // Simpler direct approach
      const { data: rt } = await supabase.from("room_types").select("occupied_beds, total_beds").eq("id", booking.room_type_id).single()
      if (rt) {
        const newVal = Math.min(rt.total_beds, (rt.occupied_beds || 0) + 1)
        await supabase.from("room_types").update({ occupied_beds: newVal }).eq("id", booking.room_type_id)
      }
    } else if (status === "cancelled" && booking.status === "confirmed") {
      const { data: rt } = await supabase.from("room_types").select("occupied_beds").eq("id", booking.room_type_id).single()
      if (rt) {
        const newVal = Math.max(0, (rt.occupied_beds || 0) - 1)
        await supabase.from("room_types").update({ occupied_beds: newVal }).eq("id", booking.room_type_id)
      }
    }
  }

  // Notify the student
  const notifTitle = status === "confirmed" ? "Booking Confirmed! 🎉" : "Booking Update"
  const notifMsg = status === "confirmed"
    ? `Your booking at ${booking.hostel_name} has been confirmed.`
    : `Your booking at ${booking.hostel_name} was cancelled.`

  await supabase.from("notifications").insert([{
    user_id: booking.user_id,
    type: status === "confirmed" ? "booking_confirmed" : "booking_cancelled",
    title: notifTitle,
    message: notifMsg,
    link: "/dashboard",
  }])

  return NextResponse.json({ data }, { headers: corsHeaders })
}

// DELETE /api/bookings/:id — hard delete (fallback)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })

  const { error } = await supabase.from("bookings").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  return NextResponse.json({ success: true }, { headers: corsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}