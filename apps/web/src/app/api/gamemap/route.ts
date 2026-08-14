import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  try {
    const backendRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/gamemap`,
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

export async function POST(req: Request) {
  const session = await auth();

  try {
    const formData = await req.formData();
    const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gamemap`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
      },
      body: formData,
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
