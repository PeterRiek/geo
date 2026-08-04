# backend

Spring Boot 3 (Java 17) API + WebSocket server for the geo.riek.me game. See the [repo root README](../../README.md) for the overall project, tech stack, and deployment. This document covers the backend's internal structure.

## Running locally

```bash
docker compose up -d postgres   # from repo root
cd apps/backend
./gradlew bootRun
```

Config is read from environment variables, all with defaults suitable for local dev against the Compose Postgres — see `src/main/resources/application.yml`. Notably `JWT_SECRET` (must match whatever mints tokens you're testing with), `UPLOADS_DIR` (where map coordinate files + preview images are stored, defaults to `./uploads`), and `ADMIN_PASSWORD` (set it to get an auto-created `ADMIN`-role login — see Roles & activation keys below; leave unset to skip).

```bash
./gradlew test
```

Tests use an in-memory H2 database (`application-test.yml`), not Postgres.

## Package layout

```
controller/   REST endpoints
websocket/    WebSocket handlers + JWT handshake auth
service/      Business logic, including the in-memory game engine
model/        JPA entities
repository/   Spring Data repositories
dto/          Request/response shapes; dto/ws/ is the WebSocket wire protocol
config/       Security, static resource serving, WebSocket registration
util/         JWT signing/parsing, geo distance/scoring math
exception/    Global error mapping (GlobalExceptionHandler)
```

## Errors

`exception/GlobalExceptionHandler.java` (`@RestControllerAdvice`) is the single place HTTP error responses are shaped, so every endpoint fails the same way: `{"error": "..."}` with an appropriate status (400 for validation, 401/403 for auth, 404 for not-found, 413 for oversized uploads, 500 for anything unexpected — the last one logged server-side). Controllers generally shouldn't catch exceptions themselves; let validation/lookup failures propagate and add a handler here instead.

## Auth

Username/password login issues a JWT (`AuthController`, `JwtUtil`); `JwtAuthFilter` validates it on every HTTP request and `JwtHandshakeInterceptor` validates it on the WebSocket handshake (token passed as a `?token=` query param, since browsers can't set headers on a WebSocket upgrade). Sessions are stateless — no server-side session store, `SecurityConfig` sets `SessionCreationPolicy.STATELESS`. Token lifetime is `jwt.expiration-ms` (`JWT_EXPIRATION_MS` env var, default 24h).

Authorization beyond "logged in" is role/permission based (`Role`, `Permission`, `MethodSecurityConfig`), checked with `@PreAuthorize` — e.g. `MANAGE_MAPS` gates map upload, `READ_USER` gates the user list, `MANAGE_KEYS` gates the activation-key admin endpoints.

`/api/auth/**`, `/api/status`, `/ws/**`, and `/uploads/images/**` are the only routes that don't require a token (`SecurityConfig`).

## Roles, permissions & activation keys

`RoleSeeder` (`@Order(1)`) runs on every startup and idempotently ensures a fixed set of permissions/roles exist by name — `PLAY_UNLIMITED`, `PLAY_100_PER_DAY`, `MANAGE_KEYS`, `READ_USER` as permissions; `ADMIN`, `VIP_100`, `VIP_UNLIMITED` as roles bundling them. It only ever finds-or-creates; it never edits or deletes a role/permission an operator set up by hand. `AdminUserSeeder` (`@Order(2)`, runs after) then creates an `ADMIN`-role user named `ADMIN_USERNAME` (default `admin`) with password `ADMIN_PASSWORD` — skipped entirely if `ADMIN_PASSWORD` is unset, or if that username already exists (it never overwrites an existing account).

Daily play quotas are resolved from tier permissions (`UserService#resolveMaxGamesPerDay`): `PLAY_UNLIMITED` → unlimited, `PLAY_100_PER_DAY` → 100/day, falling back to `app.game.daily-limit` when a user holds neither. When a user holds more than one tier, the most permissive wins.

An `ActivationKey` (`ActivationKeyService`) is a random code (`XXXX-XXXX-XXXX-XXXX`) tied to a role, a `maxUses` count, and an optional expiry. `POST /api/user/activate-key` lets any authenticated user redeem one — validated against revoked/expired/exhausted/already-redeemed-by-this-user, then the role is added to the caller and an `ActivationKeyRedemption` row is recorded (unique per key+user, so a multi-use key can't be redeemed twice by the same person). `AdminController` (`MANAGE_KEYS`) generates, lists, and revokes keys.

## Game engine

This is the core of the backend, and it's deliberately **not** database-backed while a game is in progress.

`GameService` holds all live rooms in memory (`Map<String, RoomState>`), guarded by `synchronized (room)` on every mutation — a room is a simple state machine (`WAITING → ROUND_IN_PROGRESS → ROUND_RESULTS → ... → GAME_RESULTS`) driven entirely through `GameWebSocketHandler`. The same engine backs both singleplayer and multiplayer duels — singleplayer is just a room with one player, created and started for itself immediately (`GameService#createRoom`).

Nothing is written to Postgres until a game finishes: `GameHistoryService#persistCompletedSession` fires once, when `GameService#finishGame` transitions to `GAME_RESULTS`, and flattens the in-memory `RoomState` into `GameSession`/`GameSessionPlayer`/`GameRound`/`GameGuess` rows. A room that's abandoned mid-game (server restart, all players leave) simply vanishes — no partial history record is ever created. This tradeoff is deliberate: it keeps the hot path (every guess, every round transition) free of DB round-trips, at the cost of losing state on server restart.

Round time limits are enforced server-side, not just as a client-side countdown: `RoundTimeoutScheduler` polls every second and force-resolves any room whose `roundEndsAt` has passed, treating any player who hasn't guessed (including one who's disconnected) as a timeout. A `roundTimeLimitSeconds` of `0` means unlimited and is treated as "no deadline" everywhere (`GameService#computeRoundEndsAt` returns `null`).

Disconnects don't remove a player from the room — `GameWebSocketHandler#afterConnectionClosed` marks them in `RoomState.disconnectedPlayers` and broadcasts a `PLAYER_STATUS` update, but they stay a room member (so `GET /api/game/active` can find the room again) and can rejoin with a fresh `JOIN` message, which clears the disconnected flag.

### WebSocket protocol (`/ws/game`)

Client → server messages (`ClientMessage`, `{"type", "roomId", "payload"}`):

| Type | Payload | Effect |
|---|---|---|
| `CREATE` | `GameSettings` (optional — omit for solo defaults) | Creates the room; solo games start immediately |
| `JOIN` | — | Joins/rejoins the room; broadcasts `JOINED_ROOM` |
| `START_GAME` | — | Host starts a `WAITING` multiplayer room |
| `GUESS` | `LatLng` | Records the sender's guess for the current round |
| `NEXT_ROUND` | — | Advances past `ROUND_RESULTS`; ends the game after the last round |

Server → client messages (`ServerMessage`, `{"type", "payload"}`), always carrying the full `RoomState` except where noted: `CREATED_ROOM`, `JOINED_ROOM`, `ROUND_STARTED`, `GUESS_SUBMITTED`, `ROUND_RESULTS`, `GAME_RESULTS`, `PLAYER_STATUS`, plus error responses `ROOM_EXISTS`, `ROOM_NOT_FOUND`, `INVALID_OPERATION`, `ERROR` (no payload, or a plain string).

For manually poking at this protocol outside the UI, see `scripts/ws.py` and `scripts/jwt_gen.py` at the repo root.

## Maps

A `GameMap` is a name + preview image + a server-side coordinates file (list of `LatLng`) that's never exposed over HTTP — `GameMapService` reads it straight off disk. Only the preview image under `uploads/images/**` is web-accessible (`WebConfig`). Uploading a new map (`POST /api/gamemap`, `MANAGE_MAPS` permission) takes a name, a coordinates file, and an image file as multipart form data, validated in `GameMapService#uploadMap` (name uniqueness, coordinate bounds/count, image decodability/size).

The `uploads/` directory (`coordinates/` + `images/` subfolders) is a Docker volume mount in production (see root README) — the Dockerfile pre-creates it owned by the non-root `spring` user so the volume comes up writable.

Per-user favorites live in a separate `favorite_maps` join table (`FavoriteMap`, plain `userId`/`mapId` columns — no FK constraints, mirroring `GameSession#mapId`) rather than a `@ManyToMany` on `User`/`GameMap`, so favoriting never touches either entity. `GameMapService#deleteMap` explicitly purges a map's favorite rows on delete, since there's no DB-level cascade to rely on.

The boundary-scale suggestion (`GameMapService#boundingBoxMaxErrorDistanceKm`) — the haversine distance across a map's coordinate bounding box — can be computed either from a freshly-picked file before upload, or, for a map that already exists, from its stored coordinates (`GET /api/gamemap/{id}/calculate-max-distance`, used by the edit dialog's "Calculate" button).

## REST endpoints

| Path | Notes |
|---|---|
| `POST /api/auth/login`, `/register` | Public |
| `DELETE /api/auth/delete` | Deletes the authenticated user |
| `GET /api/user/me` | Current user profile |
| `GET /api/user/can-play` | Daily play-limit check, used by the frontend's `/game/play` middleware gate. Cap is `app.game.daily-limit` (`DAILY_GAME_LIMIT` env var, default 5) and counts singleplayer and multiplayer sessions together, per participant — not just whoever created a duel room |
| `GET /api/user/list` | Requires `READ_USER` |
| `POST /api/user/activate-key` | Redeem an activation key code, granting the caller its role |
| `GET /api/admin/roles` | List roles + their permissions, requires `MANAGE_KEYS` |
| `POST /api/admin/keys` | Generate an activation key (`roleId`, `maxUses`, optional `expiresAt`), requires `MANAGE_KEYS` |
| `GET /api/admin/keys` | List all activation keys, requires `MANAGE_KEYS` |
| `DELETE /api/admin/keys/{id}` | Revoke an activation key, requires `MANAGE_KEYS` |
| `GET /api/gamemap`, `/{id}`, `/{id}/locations`, `/{id}/locations/random` | Map metadata + coordinate lookup |
| `POST /api/gamemap` | Upload a map, requires `MANAGE_MAPS` |
| `PATCH /api/gamemap/{id}`, `DELETE /api/gamemap/{id}` | Edit/delete a map — owner or `MANAGE_MAPS` only |
| `PUT /api/gamemap/{id}/favorite`, `DELETE /api/gamemap/{id}/favorite` | Favorite/unfavorite a map for the caller |
| `POST /api/gamemap/calculate-max-distance` | Suggest a boundary scale for a not-yet-uploaded coordinates file |
| `GET /api/gamemap/{id}/calculate-max-distance` | Same suggestion, recomputed from an already-uploaded map's stored coordinates |
| `GET /api/game/active` | The in-progress room the caller belongs to, if any — powers the reconnect banner |
| `GET /api/gamesession/history` | Paginated past-session summaries for the caller |
| `GET /api/gamesession/{id}` | Full round-by-round detail for one session (must be a participant) |
| `GET /api/status` | Public health check, polled by the frontend to detect a cold-starting backend |
