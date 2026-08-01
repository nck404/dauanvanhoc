import { writable } from "svelte/store";

export const userStore = writable(null);

export const API_BASE = "https://vhdp-worker.frenda.workers.dev";

export function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("vhdp_token");
  }
  return null;
}

export function setToken(token) {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("vhdp_token", token);
    } else {
      localStorage.removeItem("vhdp_token");
    }
  }
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401 || response.status === 403) {
    if (response.status === 403) {
      const text = await response.clone().text();
      if (text === "Forbidden") {
        setToken(null);
        userStore.set(null);
        if (typeof window !== "undefined") {
          window.location.href = "/login?error=banned";
        }
      }
    }
  }

  return response;
}

export async function loadUser() {
  const token = getToken();
  if (!token) {
    userStore.set(null);
    return null;
  }

  try {
    const res = await apiFetch("/api/auth/get-session");
    if (res.ok) {
      const data = await res.json();
      if (data && data.user) {
        userStore.set(data.user);
        return data.user;
      }
    }
  } catch (e) {
    console.error(e);
  }

  setToken(null);
  userStore.set(null);
  return null;
}
