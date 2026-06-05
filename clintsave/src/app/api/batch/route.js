import { NextResponse } from "next/server";
import { getTikTokVideoInfo, extractVideoUrl, extractMetadata } from "@/lib/tikwm";
import { prisma } from "@/lib/db";
import { generateSessionId, parseUrls } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { notifyBatchComplete } from "@/lib/webhooks";

const BATCH_SIZE = 5;
const TIKWM_DELAY_MS = 1200; // stay safely under 1 req/sec

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(request) {
  let sessionId;
  try {
    const body = await request.json();
    const { urls: rawUrls, webhookUrl } = body;
    const urls = Array.isArray(rawUrls) ? rawUrls : parseUrls(rawUrls || "");

    if (urls.length === 0) {
      return NextResponse.json({ error: "No valid TikTok URLs provided" }, { status: 400 });
    }

    sessionId = generateSessionId();

    const downloads = await Promise.all(
      urls.map((url) =>
        prisma.download.create({
          data: { tiktokUrl: url, status: "pending", sessionId, webhookCallback: webhookUrl || null },
        })
      )
    );

    await trackEvent("batch_started", { sessionId, urlCount: urls.length });
    processBatch(downloads.map((d) => ({ id: d.id, url: d.tiktokUrl })), sessionId, webhookUrl);

    return NextResponse.json({
      success: true,
      sessionId,
      count: urls.length,
      downloadIds: downloads.map((d) => d.id),
    });
  } catch (error) {
    await trackEvent("batch_error", { error: error.message, sessionId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function processBatch(items, sessionId, webhookUrl) {
  const results = [];

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    // Process sequentially with delay to respect tikwm 1 req/sec limit
    for (let j = 0; j < batch.length; j++) {
      if (j > 0) await sleep(TIKWM_DELAY_MS);
      const item = batch[j];
      try {
        const value = await processVideo(item.id, item.url);
        results.push({ id: item.id, tiktokUrl: item.url, status: "done", ...value });
      } catch (err) {
        results.push({ id: item.id, tiktokUrl: item.url, status: "failed" });
      }
    }
  }

  if (webhookUrl) {
    const detailedResults = await Promise.all(
      results.map((r) => prisma.download.findUnique({ where: { id: r.id } }))
    );
    await notifyBatchComplete(sessionId, detailedResults.filter(Boolean));
  }

  await trackEvent("batch_completed", {
    sessionId,
    totalResults: results.length,
    successful: results.filter((r) => r.status === "done").length,
    failed: results.filter((r) => r.status === "failed").length,
  });
}

async function processVideo(id, url) {
  try {
    await prisma.download.update({ where: { id }, data: { status: "fetching", updatedAt: new Date() } });

    const response = await getTikTokVideoInfo(url);
    if (response.code !== 0 || !response.data) {
      throw new Error(response.msg || "Failed to fetch video info");
    }

    const videoUrl = extractVideoUrl(response);
    const metadata = extractMetadata(response);
    if (!videoUrl) throw new Error("No downloadable video URL returned");

    await prisma.download.update({
      where: { id },
      data: {
        status: "done",
        videoTitle: metadata.title,
        creatorName: metadata.creatorName,
        thumbnailUrl: metadata.thumbnailUrl,
        videoUrlNoWatermark: videoUrl,
        duration: metadata.duration,
        fileSize: metadata.size ? BigInt(metadata.size) : null,
        updatedAt: new Date(),
      },
    });

    await trackEvent("download_success", { downloadId: id, url });
    return { videoTitle: metadata.title, creatorName: metadata.creatorName };
  } catch (error) {
    await prisma.download.update({
      where: { id },
      data: { status: "failed", errorMessage: error.message, updatedAt: new Date() },
    });
    await trackEvent("download_failed", { downloadId: id, url, error: error.message });
    throw error;
  }
}
