# GeoGuessr Clone

A self-hosted geography guessing game: you're dropped into a Google Street View panorama and have to guess where in the world it is by placing a pin on a map. Play solo against the clock, or duel a friend in real time.

## Features

- **Singleplayer** — pick a map and round count, guess your way through a set of locations, see your score per round and total at the end.
- **Multiplayer duels** — create a room (with a shareable invite link) or join one with a code, and play the same rounds head-to-head over WebSockets.
- **Custom maps** — maps are defined server-side and selectable from the game menu; not locked to the whole world.
- **NMPZ-style settings** — toggle move/pan/zoom independently per game.
- **Accounts & daily play limits** — username/password auth (JWT-based), with a configurable per-day game cap.
- **Light/dark mode**.

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, MUI, NextAuth v5, Google Maps JS API |
| Backend | Spring Boot 3 (Java 17), Spring Security + JWT, Spring WebSocket |
| Database | PostgreSQL |
| Deployment | Docker Compose, Portainer (GitOps stack, redeployed via a GitHub Actions webhook) |

## Project structure

```
apps/
  web/       Next.js frontend (also acts as a BFF — its API routes proxy to the backend)
  backend/   Spring Boot API + WebSocket server
scripts/     Small Python utilities for manually testing the backend (see below)
docker-compose.yml
```

## Getting started (Docker Compose)

Requirements: Docker, and a Google Maps JavaScript API key with the Street View and Maps APIs enabled.

1. Copy the env template and fill in real values:
   ```bash
   cp .env.example .env
   ```
2. Fill in `.env` — see [Environment variables](#environment-variables) below.
3. Start everything:
   ```bash
   docker compose up -d --build
   ```
4. The web app is served on `WEB_PORT` (default `3000`), the API on `BACKEND_PORT` (default `8080`).

## Environment variables

All variables live in one `.env` at the repo root, consumed by `docker-compose.yml` (see `.env.example`).

| Variable | Used by | Notes |
|---|---|---|
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | postgres, backend | Standard Postgres credentials. |
| `BACKEND_PORT` / `WEB_PORT` | host | Host-side port mapping only. Container-internal ports stay `8080`/`3000` — changing these does **not** change the values below. |
| `JWT_SECRET` | backend | Signs auth tokens. Generate with `openssl rand -base64 48`. |
| `NEXT_PUBLIC_API_URL` | web (server-side) | Next.js API routes call the backend over the **Docker network**, so this stays `http://backend:8080/api` regardless of deployment domain or `BACKEND_PORT`. |
| `NEXT_PUBLIC_WS_URL` | web (browser) | The **browser** opens this WebSocket directly, so it must be reachable from wherever your users are, not the Docker network. For a public HTTPS deployment this is `wss://your-domain/ws` — see [Deployment](#deployment) below. |
| `NEXT_PUBLIC_MAPS_KEY` | web (browser) | Google Maps JavaScript API key. |
| `NEXTAUTH_SECRET` | web | Encrypts NextAuth session tokens. Generate with `openssl rand -base64 48`. |
| `NEXTAUTH_URL` | web | The public URL of the site, e.g. `https://your-domain`. |

`NEXT_PUBLIC_*` variables are inlined into the frontend bundle **at build time** — changing them requires a rebuild of the `web` image, not just a container restart.

## Local development (without Docker)

Run Postgres + the backend via Docker, then run the frontend directly for fast iteration:

```bash
docker compose up -d postgres backend
cd apps/web
npm install
npm run dev
```

`apps/web/.env.local` should point at the locally-running backend (`http://localhost:8080/api`, `ws://localhost:8080/ws`).

Backend only, standalone:

```bash
cd apps/backend
./gradlew bootRun
./gradlew test
```

There's currently no automated test suite on the frontend.

### Manual WebSocket testing

`scripts/` has two small Python helpers for poking at the backend directly, useful when working on the multiplayer duel protocol without going through the UI:

- `jwt_gen.py <secret>` — mints a JWT for a test user against a given `JWT_SECRET`.
- `ws.py <jwt>` — connects to `/ws/duel` and lets you interactively send `JOIN`/`GUESS`/`START_GAME`/`NEXT_ROUND` messages.

```bash
pip install -r scripts/requirements.txt
python scripts/jwt_gen.py "$JWT_SECRET"
python scripts/ws.py "<token from above>"
```

## Deployment

Production runs as a Portainer Git-based stack pointed at this repo's `docker-compose.yml`. `.github/workflows/deploy.yml` pings a Portainer webhook on every push to `main` to trigger a redeploy.

Two things that trip people up when deploying behind a domain + HTTPS reverse proxy (nginx/Traefik/Caddy):

- **`NEXT_PUBLIC_WS_URL` needs no port** — just `wss://your-domain/ws`. The browser only ever talks to your domain on 443; the actual container ports are an internal detail of how your proxy reaches them.
- **The proxy must forward the WebSocket upgrade**, not just the HTTP request. For nginx, that means explicitly setting `Upgrade`/`Connection` headers on the `/ws` location block — a plain `proxy_pass` alone will silently fail the handshake.
- If the repo is private, Portainer's Git integration needs its own credentials (a GitHub Personal Access Token, not your account password — GitHub disabled password auth for git operations).
