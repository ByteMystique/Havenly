import { api } from "./client"

export async function login(data) {
  return api.post("/auth/login", data)
}

export async function signup(data) {
  return api.post("/auth/signup", data)
}