// User agents rotation pool
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
];

// Proxy list (replace with your own proxies if needed)
const PROXIES = [
  null, // Direct connection (no proxy)
  // Add proxies here if you have them:
  // 'http://user:pass@proxy1.example.com:8080',
  // 'http://user:pass@proxy2.example.com:8080',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getRandomProxy() {
  const availableProxies = PROXIES.filter((p) => p !== null);
  if (availableProxies.length === 0) return null;

  // 70% chance of using direct connection, 30% chance of using proxy
  if (Math.random() > 0.3 && PROXIES.includes(null)) return null;

  return availableProxies[Math.floor(Math.random() * availableProxies.length)];
}

async function fetchWithRotation(url, options = {}) {
  const userAgent = getRandomUserAgent();
  const proxy = getRandomProxy();

  const headers = {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "User-Agent": userAgent,
    Referer: "https://www.tikwm.com/",
    Origin: "https://www.tikwm.com",
    ...options.headers,
  };

  let fetchOptions = {
    ...options,
    headers,
    signal: AbortSignal.timeout(30000), // 30 second timeout
  };

  // If proxy is configured, use it (requires node-fetch or undici support)
  // For now, we'll just rotate headers which solves most rate limiting

  try {
    const response = await fetch(url, fetchOptions);

    if (response.status === 429) {
      // Rate limited - wait and retry once with different identity
      console.log("Rate limited, rotating identity and retrying...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return fetchWithRotation(url, options); // Recursive retry with new random headers
    }

    return response;
  } catch (error) {
    console.error("Fetch error:", error.message);
    throw error;
  }
}

export async function getTikTokVideoInfo(tiktokUrl) {
  const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`;

  const response = await fetchWithRotation(apiUrl);

  if (!response.ok) {
    throw new Error(`TikWM API error: ${response.status}`);
  }

  const data = await response.json();
  return data;
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
  };
}
