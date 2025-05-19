import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

const protectedRoutes = ["/profile", "/game"];

const middleware = async (request: NextRequest) => {
  const session = await auth();

  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (isProtected && session && Date.parse(session.expires) > Date.now()) {
    return NextResponse.redirect(new URL("/session-expired", request.url));
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
        return NextResponse.redirect(new URL("/server-starting", request.url));
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return NextResponse.redirect(new URL("/server-starting", request.url));
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

      const data = await res.json();
      // TODO: match type with api dto

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
