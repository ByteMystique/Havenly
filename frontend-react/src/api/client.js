const BASE_URL = "http://localhost:3000/api"

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    ...options
  })

  const data = await res.json()

  if (!res.ok || data.success === false) {
    throw new Error(data.error || "API Error")
  }

  return data
}

export const api = {
  get: (url) => request(url),
  post: (url, body) =>
    request(url, {
      method: "POST",
      body: JSON.stringify(body)
    }),
  delete: (url) =>
    request(url, {
      method: "DELETE"
    })
}