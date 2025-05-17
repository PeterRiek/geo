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

  if (pathname.startsWith("/game")) {
    try {
      const res = await fetch(`${process.env.API_URL}/user/can-play`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

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
