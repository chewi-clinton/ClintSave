import { prisma } from "./db";

export async function trackEvent(eventType, metadata = {}) {
  try {
    await prisma.analyticsEvent.create({
      data: { eventType, metadata },
    });
  } catch (error) {
    // non-critical, don't crash the app
    console.error("Analytics tracking error:", error);
  }
}

export async function getStats() {
  const [total, successful, failed, today, week, totalFileSize] =
    await Promise.all([
      prisma.download.count(),
      prisma.download.count({ where: { status: "done" } }),
      prisma.download.count({ where: { status: "failed" } }),
      prisma.download.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.download.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.download.aggregate({
        where: { status: "done", fileSize: { not: null } },
        _sum: { fileSize: true },
      }),
    ]);

  return {
    total,
    successful,
    failed,
    today,
    week,
    totalFileSize:
      totalFileSize._sum?.fileSize != null
        ? Number(totalFileSize._sum.fileSize)
        : 0,
    successRate: total > 0 ? ((successful / total) * 100).toFixed(1) : "0.0",
  };
}
