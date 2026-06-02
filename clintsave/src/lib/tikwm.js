const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

async function fetchWithRotation(url, options = {}, retryCount = 0) {
  const MAX_RETRIES = 3;

  if (retryCount >= MAX_RETRIES) {
    throw new Error(
      `TikWM API rate limits exhausted after ${MAX_RETRIES} processing attempts.`,
    );
  }

  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const headers = {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "User-Agent": userAgent,
    Referer: "https://www.tikwm.com/",
    Origin: "https://www.tikwm.com",
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.timeout(30000),
    });

    if (response.status === 429) {
      const delay = 2000 * (retryCount + 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRotation(url, options, retryCount + 1);
    }

    return response;
  } catch (error) {
    throw error;
  }
}

export async function getTikTokVideoInfo(tiktokUrl) {
  const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`;
  const response = await fetchWithRotation(apiUrl);

  if (!response.ok) {
    throw new Error(
      `External API returned bad status context: ${response.status}`,
    );
  }

  return await response.json();
}

export function extractVideoUrl(response) {
  if (response.code === 0 && response.data) {
    return response.data.play || response.data.hdplay || null;
  }
  return null;
}

export function extractMetadata(response) {
  if (!response.data) return null;
  return {
    title: response.data.title,
    creatorName: response.data.author?.nickname,
    thumbnailUrl: response.data.origin_cover?.url_list?.[0],
    duration: response.data.duration,
    music: response.data.music_info?.title,
    musicAuthor: response.data.music_info?.author,
    size: response.data.size || response.data.wm_size || null,
  };
}
