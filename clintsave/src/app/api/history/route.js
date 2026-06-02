import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    return NextResponse.json({
      downloads,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 },
    );
  }
}
