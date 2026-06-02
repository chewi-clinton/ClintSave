import { prisma } from "./db";

export async function trackEvent(eventType, metadata = {}) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventType,
        metadata,
      },
    });
  } catch (error) {
    console.error("Analytics tracking error:", error);
  }
}

export async function getStats() {
  const [
    totalDownloads,
    successfulDownloads,
    failedDownloads,
    todayDownloads,
    weekDownloads,
    monthDownloads,
    totalFileSize,
  ] = await Promise.all([
    prisma.download.count(),
    prisma.download.count({ where: { status: "done" } }),
    prisma.download.count({ where: { status: "failed" } }),
    prisma.download.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.download.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.download.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(1)), // Start of current month
        },
      },
    }),
    prisma.download.aggregate({
      where: { status: "done", fileSize: { not: null } },
      _sum: { fileSize: true },
    }),
  ]);

  // Convert BigInt (from Prisma aggregate) to a regular number for JSON serialization
  const totalFileSizeValue =
    totalFileSize && totalFileSize._sum && totalFileSize._sum.fileSize
      ? Number(totalFileSize._sum.fileSize)
      : 0;

  return {
    total: totalDownloads,
    successful: successfulDownloads,
    failed: failedDownloads,
    today: todayDownloads,
    week: weekDownloads,
    month: monthDownloads,
    totalFileSize: totalFileSizeValue,
    successRate:
      totalDownloads > 0
        ? ((successfulDownloads / totalDownloads) * 100).toFixed(1)
        : 0,
  };
}
