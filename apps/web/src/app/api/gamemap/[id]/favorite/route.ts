import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await auth();

  try {
    const backendRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/gamemap/${id}/favorite`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      }
    );

    if (backendRes.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
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

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await auth();

  try {
    const backendRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/gamemap/${id}/favorite`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      }
    );

    if (backendRes.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
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
