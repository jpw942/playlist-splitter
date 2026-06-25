import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@/app/generated/prisma/client";

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

  const fastapiUrl = process.env.FASTAPI_URL ?? "http://127.0.0.1:8000";
  const splitRes = await fetch(`${fastapiUrl}/split`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playlist_id: playlistId, job_id: job.id }),
  });

  if (splitRes.ok) {
    await prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.PROCESSING },
    });
  }

  return NextResponse.json({ jobId: job.id });
}