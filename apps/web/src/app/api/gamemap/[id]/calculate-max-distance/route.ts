import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await auth();

  try {
    const backendRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/gamemap/${id}/calculate-max-distance`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      }
    );

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
