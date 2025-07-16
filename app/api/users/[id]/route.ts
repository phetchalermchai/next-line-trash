import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        image: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        accounts: {
          select: {
            id: true,
            provider: true,
          },
        },
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return new NextResponse("Failed to fetch user", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPERADMIN") {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {

    await prisma.account.deleteMany({
      where: {
        userId: id,
      },
    });

    await prisma.user.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return new NextResponse("Failed to delete user", { status: 500 });
  }
}
