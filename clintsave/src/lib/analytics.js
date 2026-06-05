import { prisma } from "@/lib/db";

export async function trackEvent(eventType, metadata = {}) {
  try {
    await prisma.analyticsEvent.create({
      data: { eventType, metadata },
    });
  } catch (error) {
    // Non-fatal — don't let analytics block downloads
    console.warn("Analytics tracking skipped:", error.message);
  }
}
