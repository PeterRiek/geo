import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { checkServerStatus } from "@/lib/check-server-status";

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

  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".ico");

  if (!pathname.startsWith("/server-starting") && !isStaticAsset) {
    try {
      const serverResp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/status`
      );
      if (!serverResp.ok) {
        return NextResponse.redirect(new URL("/server-starting", request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL("/server-starting", request.url));
    }
  }

  if (pathname.startsWith("/game")) {
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

      if (!data.canPlay) {
        return NextResponse.redirect(new URL("/limit-reached", request.url));
      }
    } catch (error) {
      console.error("Error checking game limit", error);
      // Optionally block access if the backend is unreachable
      return NextResponse.redirect(new URL("/error", request.url));
    }
  }

  return NextResponse.next();
};

export default middleware;
