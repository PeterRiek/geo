import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") ?? "0";
  const size = searchParams.get("size") ?? "20";

  try {
    const backendRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/gamesession/history?page=${page}&size=${size}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

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
