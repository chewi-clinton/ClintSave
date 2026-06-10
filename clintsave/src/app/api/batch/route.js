import { NextResponse } from "next/server";
import { getTikTokVideoInfo, extractVideoUrl, extractImageUrls, extractMetadata } from "@/lib/tikwm";
import { getCobaltVideoInfo, extractCobaltMedia, buildCobaltMetadata } from "@/lib/cobalt";
import { prisma } from "@/lib/db";
import { generateSessionId, parseUrls, detectPlatform } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { notifyBatchComplete } from "@/lib/webhooks";

const BATCH_SIZE = 5;
const DELAY_MS = 1200;

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
      return NextResponse.json({ error: "No valid URLs provided (TikTok, Instagram, or Facebook)" }, { status: 400 });
    }

    sessionId = generateSessionId();

    const downloads = await Promise.all(
      urls.map((url) =>
        prisma.download.create({
          data: { sourceUrl: url, status: "pending", sessionId, webhookCallback: webhookUrl || null },
        })
      )
    );

    await trackEvent("batch_started", { sessionId, urlCount: urls.length });
    processBatch(downloads.map((d) => ({ id: d.id, url: d.sourceUrl })), sessionId, webhookUrl);

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

    for (let j = 0; j < batch.length; j++) {
      if (j > 0) await sleep(DELAY_MS);
      const item = batch[j];
      try {
        const value = await processVideo(item.id, item.url);
        results.push({ id: item.id, sourceUrl: item.url, status: "done", ...value });
      } catch {
        results.push({ id: item.id, sourceUrl: item.url, status: "failed" });
      }
    }
  }

  if (webhookUrl) {
    const detailed = await Promise.all(
      results.map((r) => prisma.download.findUnique({ where: { id: r.id } }))
    );
    await notifyBatchComplete(sessionId, detailed.filter(Boolean));
  }

  await trackEvent("batch_completed", {
    sessionId,
    totalResults: results.length,
    successful: results.filter((r) => r.status === "done").length,
    failed: results.filter((r) => r.status === "failed").length,
  });
}

async function processVideo(id, url) {
  await prisma.download.update({ where: { id }, data: { status: "fetching", updatedAt: new Date() } });

  const platform = detectPlatform(url);

  try {
    let videoUrl, metadata;

    let mediaUrls = [];

    if (platform === "tiktok") {
      const response = await getTikTokVideoInfo(url);
      if (response.code !== 0 || !response.data) {
        throw new Error(response.msg || "Failed to fetch TikTok video info");
      }
      const imageUrls = extractImageUrls(response);
      if (imageUrls.length > 0) {
        mediaUrls = imageUrls;
      } else {
        videoUrl = extractVideoUrl(response);
        if (videoUrl) mediaUrls = [videoUrl];
      }
      metadata = extractMetadata(response);
    } else {
      const response = await getCobaltVideoInfo(url);
      const { urls, thumbnailUrl } = extractCobaltMedia(response);
      mediaUrls = urls;
      metadata = buildCobaltMetadata(platform, thumbnailUrl);
    }

    if (mediaUrls.length === 0) throw new Error("No downloadable media found");
    videoUrl = mediaUrls.length === 1 ? mediaUrls[0] : JSON.stringify(mediaUrls);

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

    await trackEvent("download_success", { downloadId: id, url, platform });
    return { videoTitle: metadata.title, creatorName: metadata.creatorName };
  } catch (error) {
    await prisma.download.update({
      where: { id },
      data: { status: "failed", errorMessage: error.message, updatedAt: new Date() },
    });
    await trackEvent("download_failed", { downloadId: id, url, platform, error: error.message });
    throw error;
  }
}
