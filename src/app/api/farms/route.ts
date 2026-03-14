import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const farms = await prisma.farm.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, name: true, sizeHectares: true },
  });

  return NextResponse.json(farms);
}
