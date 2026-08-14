import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();

  try {
    const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/keys`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await backendRes.json().catch(() => undefined);

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Error calling Spring backend:", error);
    return NextResponse.json(
      { error: "Failed to call backend" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();

  try {
    const body = await req.text();
    const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/keys`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
        "Content-Type": "application/json",
      },
      body,
    });

    const data = await backendRes.json().catch(() => undefined);

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Error calling Spring backend:", error);
    return NextResponse.json(
      { error: "Failed to call backend" },
      { status: 500 }
    );
  }
}
