# web

Next.js 15 (App Router) frontend for the geo.riek.me game. See the [repo root README](../../README.md) for the overall project, tech stack, and deployment. This document covers the frontend's internal structure.

It also acts as a thin BFF: most backend calls are proxied through Next.js API routes (`src/app/api/**`) rather than hit directly from the browser, so the browser only ever needs a bearer token for the WebSocket connection (query param) — everything else rides on the NextAuth session cookie.

## Running locally

```bash
npm install
npm run dev
```

Needs `.env.local` pointing at a running backend:

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
NEXT_PUBLIC_MAPS_KEY=<Google Maps JS API key>
NEXTAUTH_SECRET=<any random string, must match across restarts>
NEXTAUTH_URL=http://localhost:3000
```

There's no automated frontend test suite currently — `npm run lint` is the only CI-relevant check.

## Auth

`src/auth.ts` configures NextAuth v5 with a `CredentialsProvider` that calls the backend's `/api/auth/login` and stores the returned JWT as `session.accessToken` (JWT session strategy — no NextAuth database). Server Components, Route Handlers, and Server Actions read the session via `auth()`; that token is then forwarded as `Authorization: Bearer <token>` when proxying to the backend.

`src/middleware.ts` runs on every request and does three things, in order:
1. Redirects unauthenticated requests to `/profile`, `/game`, `/history` back to `/`.
2. Pings `GET /api/status` on the backend (5s cache) to catch a cold-starting or unreachable backend, redirecting to `/server-starting` or `/error` rather than letting pages fail individually — `/server-starting`, `/error`, `/session-expired`, and `/limit-reached` are exempted from this check themselves, to avoid a redirect loop.
3. For `/game/play/**` specifically, calls `/api/user/can-play` (daily game cap) and redirects to `/session-expired` or `/limit-reached` as appropriate.

## Structure

```
src/app/            Routes (App Router) — pages + src/app/api/** route handlers (the BFF proxy layer)
src/components/     UI, grouped by feature (game/, auth/, layout/)
src/lib/            Non-UI logic: hooks, server actions, URL/geo helpers
src/auth.ts          NextAuth config
src/middleware.ts     Route guarding + backend health/play-limit gating (see above)
```

### Pages worth knowing

- `game/page.tsx` — the game menu (map/mode/settings selection), see `components/game/game-menu.tsx` and `components/game/menu/*`.
- `game/play/sp` / `game/play/mp` — singleplayer and multiplayer game screens; both are thin wrappers around `components/game/singleplayer/singleplayer-game.tsx` / `components/game/multiplayer/mutliplayer-game.tsx`, which share `lib/hooks/use-game-socket.ts` for the WebSocket connection.
- `game/maps/upload` — map upload form (`components/game/menu/UploadMapForm.tsx`). The page itself fetches `/api/user/me` server-side and renders a fallback instead of the form unless the user has the backend's `MANAGE_MAPS` permission — the actual upload request is still backend-enforced regardless.
- `history`, `history/[id]` — past session list and round-by-round detail, backed by `/api/gamesession/history` and `/api/gamesession/[id]`.
- `server-starting`, `error`, `session-expired`, `limit-reached` — middleware bail-out destinations, not organically navigated to.

### The WebSocket hook

`lib/hooks/use-game-socket.ts` owns the single WebSocket connection to `/ws/game` for both singleplayer and multiplayer (the backend engine doesn't distinguish them — see the [backend README](../backend/README.md#game-engine)). It queues outgoing messages sent before the socket is `OPEN` and flushes them on connect, auto-sends `JOIN` on open if a `roomId` was passed, and exposes a `reconnect()` that tears down and re-opens the socket (used by `components/game/connection-banner.tsx` after a drop). Incoming message types map directly onto the backend's `ServerMessage` types documented in the backend README.

## Environment variables

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend REST base URL, used server-side by API routes/Server Actions/middleware |
| `NEXT_PUBLIC_WS_URL` | Backend WebSocket base URL, used **client-side** by `use-game-socket.ts` — must be reachable from the browser, not just the server |
| `NEXT_PUBLIC_MAPS_KEY` | Google Maps JS API key |
| `NEXTAUTH_SECRET` | Encrypts the NextAuth session cookie |
| `NEXTAUTH_URL` | Public URL of the site |

All `NEXT_PUBLIC_*` vars are inlined into the JS bundle at build time — changing them requires a rebuild, not just a redeploy (see root README's Deployment section for how this is handled in production).
