// Platform detection

export function detectPlatform(url) {
  const u = url.trim().toLowerCase();
  if (u.includes("tiktok.com") || u.includes("vm.tiktok.com")) return "tiktok";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("facebook.com") || u.includes("fb.com") || u.includes("fb.watch")) return "facebook";
  return "unknown";
}

// URL validation — accepts TikTok, Instagram, and Facebook links

const URL_PATTERNS = [
  // TikTok
  /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i,
  /^https?:\/\/vm\.tiktok\.com\/[\w]+/i,
  /^https?:\/\/(m\.)?tiktok\.com\/v\/\d+/i,
  /^https?:\/\/(www\.)?tiktok\.com\/t\/[\w]+/i,
  // Instagram posts, reels, TV
  /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+/i,
  // Facebook videos, watch, reels, share
  /^https?:\/\/(www\.|m\.)?facebook\.com\/.+\/videos\//i,
  /^https?:\/\/(www\.|m\.)?facebook\.com\/watch/i,
  /^https?:\/\/fb\.watch\/[\w]+/i,
  /^https?:\/\/(www\.|m\.)?facebook\.com\/reel\/\d+/i,
  /^https?:\/\/(www\.|m\.)?facebook\.com\/share\/[rv]\/[\w]+/i,
];

export function isValidUrl(url) {
  return URL_PATTERNS.some((p) => p.test(url.trim()));
}

export function parseUrls(text) {
  return text
    .split(/[\s,\n]+/)
    .map((url) => url.trim())
    .filter((url) => url.length > 0 && isValidUrl(url));
}

export function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export function formatDuration(seconds) {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatDate(dateString) {
  if (!dateString) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
