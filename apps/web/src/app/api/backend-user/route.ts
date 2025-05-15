import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();

  try {
    const backendRes = await fetch("http://localhost:5434/api/user/me", {
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
