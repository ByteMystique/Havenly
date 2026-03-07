import { api } from "./client"

export async function createBooking(data) {
  return api.post("/bookings", data)
}

export async function getUserBookings(userId) {
  return api.get(`/bookings/user?user_id=${userId}`)
}

export async function deleteBooking(id) {
  return api.delete(`/bookings/${id}`)
}