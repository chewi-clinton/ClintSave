import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit")) || 50;
  const offset = parseInt(searchParams.get("offset")) || 0;
  const status = searchParams.get("status");

  try {
    const where = {};
    if (
      status &&
      ["pending", "fetching", "downloading", "done", "failed"].includes(status)
    ) {
      where.status = status;
    }

    const [downloads, total] = await Promise.all([
      prisma.download.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      prisma.download.count({ where }),
    ]);

    const safeDownloads = downloads.map((d) => ({
      ...d,
      fileSize: d.fileSize != null ? Number(d.fileSize) : null,
    }));

    return NextResponse.json({
      downloads: safeDownloads,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to execute historical dataset lookup" },
      { status: 500 },
    );
  }
}
