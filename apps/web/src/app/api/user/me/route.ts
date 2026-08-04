import { NextResponse } from "next/server";
import { auth, unstable_update } from "@/auth";

export async function GET() {
  const session = await auth();

  try {
    const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await backendRes.json();

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Error calling Spring backend:", error);
    return NextResponse.json(
      { error: "Failed to call backend" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const session = await auth();

  try {
    const body = await req.text();
    const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
        "Content-Type": "application/json",
      },
      body,
    });

    const data = await backendRes.json().catch(() => undefined);

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    // The backend issues a fresh token since the JWT subject is the username — swap it into
    // the session cookie here so the caller doesn't need a separate re-login.
    await unstable_update({ user: { name: data.username }, accessToken: data.token });

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Error calling Spring backend:", error);
    return NextResponse.json(
      { error: "Failed to call backend" },
      { status: 500 }
    );
  }
}
