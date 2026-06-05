import { NextResponse } from "next/server";

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

export async function POST(request) {
  const { username } = await request.json();
  if (!username)
    return NextResponse.json({ error: "Username required" }, { status: 400 });

  const clean = username.replace("@", "").trim();

  try {
    // Step 1: get user info + their latest video ids via the main API
    // tikwm single-video endpoint accepts a profile URL too
    const profileUrl = `https://www.tiktok.com/@${clean}`;
    const userInfo = await tikwmPost({ url: profileUrl, hd: "1" });

    // If that worked and has videos list, use it
    if (userInfo?.code === 0 && userInfo?.data) {
      const d = userInfo.data;
      // Some accounts return a videos array directly
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
        return NextResponse.json({ videos, author: d.author });
      }
    }

    // Step 2: fallback — use tikwm's /api/user/info to get the uid,
    // then fetch videos via uid-based endpoint
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
      throw new Error(infoData?.msg || "Could not fetch user info — tikwm may be blocking this request");
    }

    const author = infoData?.data?.user;
    const uid = author?.id;
    if (!uid) throw new Error("Could not resolve user ID");

    // Step 3: fetch videos by uid
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
      throw new Error("Cloudflare is blocking tikwm profile requests from server. Use the batch tab and paste video URLs manually instead.");
    }

    if (videosData?.code !== 0) throw new Error(videosData?.msg || "Failed to fetch videos");

    const videos = (videosData?.data?.videos || []).map((v) => ({
      id: v.video_id,
      title: v.title,
      url: `https://www.tiktok.com/@${clean}/video/${v.video_id}`,
      playUrl: v.hdplay || v.play || null,
      thumbnail: v.cover || null,
      duration: v.duration || null,
    }));

    return NextResponse.json({ videos, author });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
