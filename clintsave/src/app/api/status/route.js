import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  try {
    let downloads;

    if (sessionId) {
      downloads = await prisma.download.findMany({
        where: { sessionId },
        orderBy: { createdAt: "asc" },
      });
    } else {
      downloads = await prisma.download.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
      });
    }

    const safeDownloads = downloads.map((d) => ({
      ...d,
      fileSize: d.fileSize != null ? Number(d.fileSize) : null,
    }));

    return NextResponse.json({ downloads: safeDownloads });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch engine status parameters" },
      { status: 500 },
    );
  }
}
