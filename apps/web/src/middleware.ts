import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

const protectedRoutes = ["/profile", "/game"];

interface CanPlayResponse {
  canPlay: boolean;
  gamesPlayedToday: number;
  maxGamesPerDay: number;
}

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

  if (!pathname.startsWith("/server-starting") && !isStaticAsset) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3_000);

      const serverResp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/status`,
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      if (!serverResp.ok) {
        const serverStartingUrl = new URL("/server-starting", request.url);
        serverStartingUrl.searchParams.set("from", pathname + request.nextUrl.search);
        return NextResponse.redirect(serverStartingUrl);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        const serverStartingUrl = new URL("/server-starting", request.url);
        serverStartingUrl.searchParams.set("from", pathname + request.nextUrl.search);
        return NextResponse.redirect(serverStartingUrl);
      } else {
        console.error("Error checking server status", error);
        return NextResponse.redirect(new URL("/error", request.url));
      }
    }
  }

  if (pathname.startsWith("/game/play")) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user/can-play`,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );
      
      if (res.status === 401) {
        const errorData = await res.json();
        if (errorData.error === "JWT token expired") {
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
