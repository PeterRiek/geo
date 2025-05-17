import { NextResponse } from "next/server";

export async function GET() {
  try {
    const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/status`);
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
