import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { playlistId, playlistName } = await request.json();

  const job = await prisma.job.create({
    data: {
      userId: session.user.id,
      playlistId,
      playlistName,
    },
  });

  return NextResponse.json({ jobId: job.id });
}