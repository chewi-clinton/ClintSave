// Cobalt.tools API wrapper — handles Instagram posts/reels and Facebook videos/reels

export async function getCobaltVideoInfo(url) {
  const res = await fetch("https://api.cobalt.tools/", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      videoQuality: "max",
      downloadMode: "video",
      filenameStyle: "classic",
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cobalt API error ${res.status}: ${text.slice(0, 200)}`);
  }

  return await res.json();
}

export function extractCobaltUrl(data) {
  if (data.status === "redirect" || data.status === "tunnel") {
    return data.url || null;
  }
  if (data.status === "picker" && data.picker?.length > 0) {
    const video = data.picker.find((p) => p.type === "video");
    return video?.url || data.picker[0]?.url || null;
  }
  return null;
}

export function buildCobaltMetadata(platform) {
  return {
    title: platform === "instagram" ? "Instagram Video" : "Facebook Video",
    creatorName: null,
    thumbnailUrl: null,
    duration: null,
    size: null,
  };
}

// Fetch an Instagram public profile and return a list of video posts.
// Uses Instagram's unofficial web API — works for public profiles only.
export async function getInstagramProfile(username) {
  const clean = username.replace("@", "").trim();

  const res = await fetch(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${clean}`,
    {
      headers: {
        "x-ig-app-id": "936619743392459",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "X-Requested-With": "XMLHttpRequest",
      },
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!res.ok) throw new Error(`Instagram returned ${res.status} — profile may be private`);

  const data = await res.json();
  const user = data?.data?.user;
  if (!user) throw new Error("Could not load Instagram profile — it may be private or the username is wrong");

  const edges = user?.edge_owner_to_timeline_media?.edges || [];
  const videos = edges
    .filter((e) => e.node?.is_video)
    .map((e) => ({
      id: e.node.id,
      title:
        e.node.edge_media_to_caption?.edges?.[0]?.node?.text?.slice(0, 80) ||
        "Instagram Reel",
      url: `https://www.instagram.com/p/${e.node.shortcode}/`,
      playUrl: null, // fetched via cobalt on demand
      thumbnail: e.node.thumbnail_src || e.node.display_url || null,
      duration: e.node.video_duration ? Math.round(e.node.video_duration) : null,
    }));

  const author = {
    nickname: user.full_name || clean,
    unique_id: clean,
    avatar: user.profile_pic_url_hd || user.profile_pic_url || null,
  };

  return { videos, author };
}
