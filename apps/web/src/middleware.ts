import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

const protectedRoutes = ["/profile", "/game", "/history", "/admin"];

interface CanPlayResponse {
  canPlay: boolean;
  gamesPlayedToday: number;
  maxGamesPerDay: number;
}

type ServerStatusOutcome = "ok" | "starting" | "error";

const SERVER_STATUS_CACHE_MS = 5_000;
let serverStatusCache: { outcome: ServerStatusOutcome; checkedAt: number } | null = null;

const checkServerStatus = async (): Promise<ServerStatusOutcome> => {
  const now = Date.now();
  if (serverStatusCache && now - serverStatusCache.checkedAt < SERVER_STATUS_CACHE_MS) {
    return serverStatusCache.outcome;
  }

  let outcome: ServerStatusOutcome;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3_000);

    const serverResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/status`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);
    outcome = serverResp.ok ? "ok" : "starting";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      outcome = "starting";
    } else {
      const cause = error instanceof Error ? error.cause : undefined;
      console.error(
        "Error checking server status",
        error,
        cause ? `cause: ${cause}` : ""
      );
      outcome = "error";
    }
  }

  serverStatusCache = { outcome, checkedAt: now };
  return outcome;
};

const middleware = async (request: NextRequest) => {
  const session = await auth();

  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".ico");

  // These are the middleware's own bail-out destinations below — none of them
  // need (or can survive) the backend being reachable, so re-checking on the
  // redirect target itself would just redirect right back to itself forever.
  const isHealthCheckExempt =
    pathname.startsWith("/server-starting") ||
    pathname.startsWith("/error") ||
    pathname.startsWith("/session-expired") ||
    pathname.startsWith("/limit-reached");

  if (!isHealthCheckExempt && !isStaticAsset) {
    const outcome = await checkServerStatus();

    if (outcome === "starting") {
      const serverStartingUrl = new URL("/server-starting", request.url);
      serverStartingUrl.searchParams.set("from", pathname + request.nextUrl.search);
      return NextResponse.redirect(serverStartingUrl);
    }

    if (outcome === "error") {
      return NextResponse.redirect(new URL("/error", request.url));
    }
  }

  if (pathname.startsWith("/game/play")) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5_000);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user/can-play`,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (res.status === 401) {
        // JwtAuthFilter returns one of three distinct messages for an expired token, an
        // undecodable/malformed one, or one that no longer matches the user — all three mean the
        // same thing to the frontend: re-authenticate.
        const errorData = await res.json();
        if (typeof errorData.error === "string" && errorData.error.startsWith("JWT token")) {
          return NextResponse.redirect(new URL("/session-expired", request.url));
        }
        return NextResponse.redirect(new URL("/error", request.url));
      }

      const data: CanPlayResponse = await res.json();

      if (!data.canPlay) {
        return NextResponse.redirect(new URL("/limit-reached", request.url));
      }
    } catch (error) {
      console.error("Error checking game limit", error);
      return NextResponse.redirect(new URL("/error", request.url));
    }
  }

  return NextResponse.next();
};

export default middleware;
