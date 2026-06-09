const BASE_URL = "https://borjoun-production.up.railway.app/api";

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("Could not connect to the backend API. Make sure FastAPI is running on http://localhost:8000.");
  }

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { detail: text };
  }

  if (!response.ok) {
    const raw = data.error || data.detail || "Something went wrong";
    const message = typeof raw === "string" && raw.trimStart().startsWith("<")
      ? "Server error — please try again later."
      : raw;
    throw new Error(message);
  }

  return data;
}
