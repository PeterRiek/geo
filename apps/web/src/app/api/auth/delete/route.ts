import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function DELETE() {
  const session = await auth();

  try {
    const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/delete`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await backendRes.text();

    return new NextResponse(data, { status: backendRes.status });
  } catch (error) {
    console.error("Error calling Spring backend:", error);
    return NextResponse.json(
      { error: "Failed to call backend" },
      { status: 500 }
    );
  }
}
