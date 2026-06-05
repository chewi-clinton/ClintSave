import { prisma } from "@/lib/db";

export async function trackEvent(eventType, metadata = {}) {
  try {
    await prisma.analyticsEvent.create({
      data: { eventType, metadata },
    });
  } catch (error) {
    console.warn("Analytics tracking skipped:", error.message);
  }
}

export async function getStats() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [total, successful, failed, today, week, fileSizeResult] = await Promise.all([
    prisma.download.count(),
    prisma.download.count({ where: { status: "done" } }),
    prisma.download.count({ where: { status: "failed" } }),
    prisma.download.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.download.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.download.aggregate({
      _sum: { fileSize: true },
      where: { status: "done" },
    }),
  ]);

  const totalFileSize = fileSizeResult._sum.fileSize
    ? Number(fileSizeResult._sum.fileSize)
    : 0;

  const successRate = total > 0
    ? ((successful / total) * 100).toFixed(1)
    : "0.0";

  return { total, successful, failed, today, week, successRate, totalFileSize };
}
