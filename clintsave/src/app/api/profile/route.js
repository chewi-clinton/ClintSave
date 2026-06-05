import { NextResponse } from "next/server";
import { getInstagramProfile } from "@/lib/cobalt";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

function getRandomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function tikwmPost(bodyObj) {
  const res = await fetch("https://www.tikwm.com/api/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": getRandomUA(),
      Referer: "https://www.tikwm.com/",
      Origin: "https://www.tikwm.com",
    },
    body: new URLSearchParams(bodyObj),
    signal: AbortSignal.timeout(30000),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error("tikwm returned non-JSON: " + text.slice(0, 100)); }
}

async function getTikTokProfile(username) {
  const clean = username.replace("@", "").trim();
  const profileUrl = `https://www.tiktok.com/@${clean}`;
  const userInfo = await tikwmPost({ url: profileUrl, hd: "1" });

  if (userInfo?.code === 0 && userInfo?.data) {
    const d = userInfo.data;
    const rawVideos = d.videos || d.related_videos || [];
    if (rawVideos.length > 0) {
      const videos = rawVideos.map((v) => ({
        id: v.id || v.video_id,
        title: v.title,
        url: `https://www.tiktok.com/@${clean}/video/${v.id || v.video_id}`,
        playUrl: v.hdplay || v.play || null,
        thumbnail: v.cover || v.origin_cover || null,
        duration: v.duration || null,
      }));
      return { videos, author: d.author };
    }
  }

  // Fallback: resolve uid then fetch posts
  const infoRes = await fetch("https://www.tikwm.com/api/user/info", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": getRandomUA(),
      Referer: "https://www.tikwm.com/",
      Origin: "https://www.tikwm.com",
    },
    body: new URLSearchParams({ unique_id: clean }),
    signal: AbortSignal.timeout(30000),
  });
  const infoText = await infoRes.text();
  let infoData;
  try { infoData = JSON.parse(infoText); } catch { throw new Error("user/info returned non-JSON"); }

  if (infoData?.code !== 0) {
    throw new Error(infoData?.msg || "Could not fetch TikTok user info");
  }

  const author = infoData?.data?.user;
  const uid = author?.id;
  if (!uid) throw new Error("Could not resolve TikTok user ID");

  const videosRes = await fetch("https://www.tikwm.com/api/user/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": getRandomUA(),
      Referer: "https://www.tikwm.com/",
      Origin: "https://www.tikwm.com",
    },
    body: new URLSearchParams({ uid, count: "35", cursor: "0" }),
    signal: AbortSignal.timeout(30000),
  });
  const videosText = await videosRes.text();
  let videosData;
  try { videosData = JSON.parse(videosText); } catch {
    throw new Error("Cloudflare is blocking tikwm profile requests. Paste video URLs into the Batch tab instead.");
  }

  if (videosData?.code !== 0) throw new Error(videosData?.msg || "Failed to fetch TikTok videos");

  const videos = (videosData?.data?.videos || []).map((v) => ({
    id: v.video_id,
    title: v.title,
    url: `https://www.tiktok.com/@${clean}/video/${v.video_id}`,
    playUrl: v.hdplay || v.play || null,
    thumbnail: v.cover || null,
    duration: v.duration || null,
  }));

  return { videos, author };
}

export async function POST(request) {
  const body = await request.json();
  const { username, platform = "tiktok" } = body;

  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  try {
    if (platform === "instagram") {
      const result = await getInstagramProfile(username);
      return NextResponse.json(result);
    }

    const result = await getTikTokProfile(username);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
