"use client";

// Drop-in replacement for fetch() when calling this app's own /api/** BFF routes from a client
// component. Every JWT failure the backend can produce (expired, invalid, or no longer matching
// the user — see JwtAuthFilter) surfaces here as a plain 401, and it always means the same thing
// to the frontend: the session needs re-authenticating. Redirect to /session-expired (which signs
// out and forwards to /login) instead of letting callers render the raw error body as if it were
// ordinary form/data validation feedback.
export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const res = await fetch(input, init);
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/session-expired";
  }
  return res;
};
