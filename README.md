# geo.riek.me

A self-hosted geography guessing game: you're dropped into a Google Street View panorama and have to guess where in the world it is by placing a pin on a map. Play solo against the clock, or duel a friend in real time.

## Features

- **Singleplayer** — pick a map and round count, guess your way through a set of locations, see your score per round and total at the end.
- **Multiplayer duels** — create a room (with a shareable invite link) or join one with a code, and play the same rounds head-to-head over WebSockets.
- **Custom maps** — maps are defined server-side and selectable from the game menu; not locked to the whole world. Favorite the ones you play most for quick access, and recalculate a map's boundary scale after upload if its coordinates change.
- **NMPZ-style settings** — toggle move/pan/zoom independently per game.
- **Accounts & daily play limits** — username/password auth (JWT-based), with a configurable per-day game cap. The homepage surfaces an "Explore maps" suggestion instead of "Jump back in" once you're out of games for the day, or before you've played your first one.
- **Roles, permissions & activation keys** — a role/permission system (e.g. `PLAY_UNLIMITED`, `PLAY_100_PER_DAY`) gates perks and admin actions. Admins (`MANAGE_KEYS` permission) generate redeemable activation keys from `/admin/keys`, tied to a role, a max-use count, and an optional expiry; players redeem one from `/profile` to raise their daily game cap or unlock other perks. An `admin` account with the `ADMIN` role is auto-created on first startup from `ADMIN_USERNAME`/`ADMIN_PASSWORD`.
- **Light/dark mode**.

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, MUI, NextAuth v5, Google Maps JS API |
| Backend | Spring Boot 3 (Java 17), Spring Security + JWT, Spring WebSocket |
| Database | PostgreSQL |
| Deployment | GitHub Actions builds & pushes images to GHCR, Docker Compose + Portainer pull and run them (GitOps stack, redeployed via a webhook) |

## Project structure

```
apps/
  web/       Next.js frontend (also acts as a BFF — its API routes proxy to the backend)
  backend/   Spring Boot API + WebSocket server
scripts/     Small Python utilities for manually testing the backend (see below)
docker-compose.yml
```

## Getting started (Docker Compose)

`backend` and `web` are pulled as prebuilt images from GHCR (see [Deployment](#deployment)) rather than built by Compose — so `docker compose up` needs those images to already exist, i.e. `.github/workflows/deploy.yml` must have run at least once (push to `main`) with GHCR credentials configured.

1. Copy the env template and fill in real values:
   ```bash
   cp .env.example .env
   ```
2. Fill in `.env` — see [Environment variables](#environment-variables) below.
3. If the images are private, log in once so Compose can pull them:
   ```bash
   docker login ghcr.io
   ```
4. Start everything:
   ```bash
   docker compose up -d
   ```
5. The web app is served on `WEB_PORT` (default `3000`), the API on `BACKEND_PORT` (default `8080`).

## Environment variables

All variables live in one `.env` at the repo root, consumed by `docker-compose.yml` (see `.env.example`).

| Variable | Used by | Notes |
|---|---|---|
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | postgres, backend | Standard Postgres credentials. |
| `BACKEND_PORT` / `WEB_PORT` | host | Host-side port mapping only. Container-internal ports stay `8080`/`3000`. |
| `JWT_SECRET` | backend | Signs auth tokens. Generate with `openssl rand -base64 48`. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | backend | Bootstraps an admin account (`ADMIN` role) on first startup — skipped if a user with that username already exists, so changing `ADMIN_PASSWORD` later has no effect. `ADMIN_USERNAME` defaults to `admin`; `ADMIN_PASSWORD` is required. |
| `IMAGE_NAME` | web, backend | GHCR namespace, e.g. `peterriek/geoguessr-clone`. Images are pulled as `ghcr.io/<IMAGE_NAME>-backend` / `ghcr.io/<IMAGE_NAME>-web` — must match the `IMAGE_NAME` variable set on the `prd` GitHub environment. |
| `NEXTAUTH_SECRET` | web | Encrypts NextAuth session tokens. Generate with `openssl rand -base64 48`. |
| `NEXTAUTH_URL` | web | The public URL of the site, e.g. `https://your-domain`. |

`NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` / `NEXT_PUBLIC_MAPS_KEY` are **not** in this `.env` anymore — they're inlined into the `web` image at CI build time (see [Deployment](#deployment)), so they live as variables/secrets on the `prd` GitHub environment instead. Changing them means updating GitHub and pushing, not editing anything on the deploy host.

## Local development (without Docker)

`backend` in `docker-compose.yml` now pulls a prebuilt image rather than building from source, so it won't reflect local backend changes — run it directly instead. Run Postgres via Docker, the backend via Gradle, and the frontend via `next dev`, all pointed at each other:

```bash
docker compose up -d postgres
cd apps/backend
ADMIN_PASSWORD=changeme ./gradlew bootRun # omit to skip admin user bootstrap
```

```bash
cd apps/web
npm install
npm run dev
```

`apps/web/.env.local` should point at the locally-running backend (`http://localhost:8080/api`, `ws://localhost:8080/ws`).

Backend tests:

```bash
cd apps/backend
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

On every push to `main`, `.github/workflows/deploy.yml`:

1. Builds the `backend` and `web` images and pushes both to GHCR, tagged `latest` and with the commit SHA.
2. Pings a Portainer webhook to redeploy.

Portainer then just pulls the already-built images and restarts containers — it never runs a Docker build itself. This matters because Portainer's Git-stack deploys used to build both images inline as part of the deploy request; on a slow host that build could take longer than whatever reverse proxy sits in front of Portainer's own UI is willing to wait, producing a 504 and leaving containers half-created. Moving the build into CI removes that failure mode entirely — a redeploy is now just a pull + restart.

**Required GitHub setup**, on the `prd` environment (Settings → Environments → prd):
- Variables: `IMAGE_NAME` (e.g. `peterriek/geoguessr-clone`), `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`
- Secrets: `NEXT_PUBLIC_MAPS_KEY`, `PORTAINER_WEBHOOK_URL`

**Required on the deploy host**, since GHCR images are private by default: log Docker in to `ghcr.io` with a PAT that has `read:packages` scope (or add `ghcr.io` as a registry in Portainer under Registries), otherwise pulls will fail with an auth error.

Two more things that trip people up when deploying behind a domain + HTTPS reverse proxy (nginx/Traefik/Caddy):

- **`NEXT_PUBLIC_WS_URL` needs no port** — just `wss://your-domain/ws`. The browser only ever talks to your domain on 443; the actual container ports are an internal detail of how your proxy reaches them.
- **The proxy must forward the WebSocket upgrade**, not just the HTTP request. For nginx, that means explicitly setting `Upgrade`/`Connection` headers on the `/ws` location block — a plain `proxy_pass` alone will silently fail the handshake.
- **The proxy must also forward `/uploads/`** to the `backend` container — uploaded map preview images are served from there (`GameMap.imageUrl`, built client-side as `https://your-domain/uploads/images/<file>`; see `WebConfig`/`SecurityConfig` in the backend). A proxy config with only `/` → `web` and `/ws` → `backend` routes `/uploads/` to the `web` container by default, which has no such route and 404s — the images will load fine when the frontend is pointed straight at the backend (e.g. local dev), masking the gap until you deploy behind the real domain. For nginx, a plain `proxy_pass` block is enough (no upgrade headers needed, unlike `/ws`):
  ```nginx
  location /uploads/ {
      proxy_pass http://backend:8080/uploads/;
  }
  ```
- If the repo is private, Portainer's Git integration (used to fetch `docker-compose.yml` itself) needs its own credentials — a GitHub Personal Access Token, not your account password, since GitHub disabled password auth for git operations.
