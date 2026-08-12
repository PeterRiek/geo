# geo.riek.me

A self-hosted geography guessing game: you're dropped into a Google Street View panorama and have to guess where in the world it is by placing a pin on a map. Play solo against the clock, or duel friends in real time.

## Features

- **Singleplayer** — pick a map and round count, guess your way through a set of locations.
- **Multiplayer duels** — create or join a room and play head-to-head over WebSockets.
- **Custom maps** — server-defined, selectable from the game menu, with favorites.
- **NMPZ-style settings** — toggle move/pan/zoom independently per game.
- **Accounts & daily play limits** — JWT-based auth with a configurable per-day game cap.
- **Roles, permissions & activation keys** — admins issue keys from `/admin/keys` that players redeem at `/profile` for perks.

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, MUI, NextAuth v5, Google Maps JS API |
| Backend | Spring Boot 3 (Java 17), Spring Security + JWT, Spring WebSocket |
| Database | PostgreSQL |
| Deployment | GitHub Actions builds & pushes images to GHCR, Docker Compose + Portainer pull and run them |

## Project structure

```
apps/
  web/       Next.js frontend (also acts as a BFF — its API routes proxy to the backend)
  backend/   Spring Boot API + WebSocket server
scripts/     Small Python utilities for manually testing the backend (see below)
docker-compose.yml
```

## Getting started (Docker Compose)

1. Copy the env template and fill in real values:
   ```bash
   cp .env.example .env
   ```
2. Fill in `.env` — see [Environment variables](#environment-variables) below.
3. Log in to the image registry if needed:
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
| `BACKEND_PORT` / `WEB_PORT` | host | Host-side port mapping. Container-internal ports stay `8080`/`3000`. |
| `JWT_SECRET` | backend | Generate with `openssl rand -base64 48`. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | backend | Bootstraps an admin account (`ADMIN` role) on first startup. `ADMIN_USERNAME` defaults to `admin`; `ADMIN_PASSWORD` is required. |
| `IMAGE_NAME` | web, backend | Image namespace, e.g. `peterriek/geo`. Images are pulled as `ghcr.io/<IMAGE_NAME>-backend` / `ghcr.io/<IMAGE_NAME>-web`. |
| `NEXTAUTH_SECRET` | web | Generate with `openssl rand -base64 48`. |
| `NEXTAUTH_URL` | web | The public URL of the site, e.g. `https://your-domain`. |

`NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` / `NEXT_PUBLIC_MAPS_KEY` are set as variables/secrets on the `prd` GitHub environment and get inlined into the `web` image at CI build time.

## Local development (without Docker)

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

### Manual WebSocket testing

`scripts/` has two small Python helpers for poking at the backend directly:

- `jwt_gen.py <secret>` — mints a JWT for a test user against a given `JWT_SECRET`.
- `ws.py <jwt>` — connects to `/ws/duel` and lets you interactively send `JOIN`/`GUESS`/`START_GAME`/`NEXT_ROUND` messages.

```bash
pip install -r scripts/requirements.txt
python scripts/jwt_gen.py "$JWT_SECRET"
python scripts/ws.py "<token from above>"
```

## Deployment

On every push to `main`, `.github/workflows/deploy.yml` builds and pushes `backend`/`web` images to GHCR, then pings a Portainer webhook to redeploy.

**GitHub setup**, on the `prd` environment (Settings → Environments → prd):
- Variables: `IMAGE_NAME` (e.g. `peterriek/geo`), `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`
- Secrets: `NEXT_PUBLIC_MAPS_KEY`, `PORTAINER_WEBHOOK_URL`

**On the deploy host**: log Docker in to `ghcr.io` with a PAT that has `read:packages` scope (or add `ghcr.io` as a registry in Portainer under Registries).

**Reverse proxy config** (nginx/Traefik/Caddy):

- `NEXT_PUBLIC_WS_URL` — just `wss://your-domain/ws`, no port.
- Forward the WebSocket upgrade on the `/ws` location (set `Upgrade`/`Connection` headers).
- Forward `/uploads/` to the `backend` container:
  ```nginx
  location /uploads/ {
      proxy_pass http://backend:8080/uploads/;
  }
  ```

If the repo is private, give Portainer's Git integration a GitHub Personal Access Token.
</content>
