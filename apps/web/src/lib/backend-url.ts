// Browser-reachable backend origin, derived from NEXT_PUBLIC_WS_URL (the only
// other backend URL env var guaranteed reachable from the browser itself —
// NEXT_PUBLIC_API_URL may point at a docker-internal hostname in production).
export const getPublicBackendOrigin = (): string =>
  (process.env.NEXT_PUBLIC_WS_URL ?? "")
    .replace(/^ws/, "http")
    .replace(/\/ws\/?$/, "");
