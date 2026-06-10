import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const filename = searchParams.get("filename") || "video.mp4";

  if (!url) {
    return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
  }

  const referer = url.includes("tiktok") || url.includes("tiktokcdn")
    ? "https://www.tiktok.com/"
    : url.includes("instagram") || url.includes("cdninstagram")
    ? "https://www.instagram.com/"
    : url.includes("facebook") || url.includes("fbcdn")
    ? "https://www.facebook.com/"
    : "https://www.google.com/";

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Referer: referer,
        Range: "bytes=0-",
      },
    });

    if (!response.ok) throw new Error(`Source returned ${response.status}`);

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const contentLength = response.headers.get("content-length");
    const safeFilename = filename.replace(/[^\x00-\x7F]/g, "") || "video.mp4";
    const encodedFilename = encodeURIComponent(filename);

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`
    );
    headers.set("Cache-Control", "no-store");
    headers.set("X-Content-Type-Options", "nosniff");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new NextResponse(response.body, { status: 200, headers });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
