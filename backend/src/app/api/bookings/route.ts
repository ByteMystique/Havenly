import { NextResponse } from "next/server"
import { supabase, getUser } from "@/lib/auth"
import { corsHeaders } from "@/lib/cors"

// POST /api/bookings — create booking (student)
export async function POST(req: Request) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })

  try {
    const body = await req.json()
    const {
      hostelId, hostelName, roomTypeId, roomTypeLabel,
      checkIn, checkOut, guests, totalAmount, paymentMethod, transactionId
    } = body

    const booking = {
      id: Date.now(),
      user_id: user.id,
      hostel_id: hostelId,
      hostel_name: hostelName,
      room_type_id: roomTypeId,
      room_type_label: roomTypeLabel,
      student_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Student",
      student_email: user.email,
      status: "pending",
      check_in: checkIn,
      check_out: checkOut,
      guests: guests || 1,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      transaction_id: transactionId,
      booked_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("bookings").insert([booking]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })

    // Notify the hostel owner
    const { data: hostel } = await supabase.from("hostels").select("owner_id, name").eq("id", hostelId).single()
    if (hostel?.owner_id) {
      await supabase.from("notifications").insert([{
        user_id: hostel.owner_id,
        type: "booking_request",
        title: "New Booking Request",
        message: `${booking.student_name} requested ${roomTypeLabel} at ${hostelName}`,
        link: "/owner/bookings",
      }])
    }

    return NextResponse.json({ data }, { status: 201, headers: corsHeaders })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500, headers: corsHeaders })
  }
}

// GET /api/bookings?hostel_id=X — hostel-specific bookings (owner)
export async function GET(req: Request) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })

  const { searchParams } = new URL(req.url)
  const hostelId = searchParams.get("hostel_id")

  if (hostelId) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("hostel_id", hostelId)
      .order("booked_at", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
    return NextResponse.json({ data }, { headers: corsHeaders })
  }

  return NextResponse.json({ error: "Missing hostel_id" }, { status: 400, headers: corsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}