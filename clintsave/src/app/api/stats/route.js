import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    const safeDownloads = JSON.parse(
      JSON.stringify(downloads, (key, value) =>
        typeof value === "bigint" ? Number(value) : value,
      ),
    );

    return NextResponse.json({ downloads: safeDownloads });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch engine status parameters" },
      { status: 500 },
    );
  }
}
