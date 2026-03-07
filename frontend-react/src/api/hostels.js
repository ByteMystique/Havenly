import { api } from "./client"

export async function getHostels() {
  return api.get("/hostels")
}

export async function getHostel(id) {
  return api.get(`/hostels/${id}`)
}