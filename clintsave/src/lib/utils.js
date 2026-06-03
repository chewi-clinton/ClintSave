export function isValidTikTokUrl(url) {
  const patterns = [
    /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i,
    /^https?:\/\/vm\.tiktok\.com\/[\w]+/i,
    /^https?:\/\/(m\.)?tiktok\.com\/v\/\d+/i,
    /^https?:\/\/(www\.)?tiktok\.com\/t\/[\w]+/i,
  ];
  return patterns.some((pattern) => pattern.test(url.trim()));
}

export function parseUrls(text) {
  return text
    .split(/[\s,\n]+/)
    .map((url) => url.trim())
    .filter((url) => url.length > 0 && isValidTikTokUrl(url));
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

export function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
