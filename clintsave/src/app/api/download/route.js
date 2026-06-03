import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const filename = searchParams.get("filename") || "video.mp4";

  if (!url) {
    return NextResponse.json(
      { error: "Missing URL parameter" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.tiktok.com/",
      },
    });

    if (!response.ok) throw new Error(`Source returned ${response.status}`);

    const contentType = response.headers.get("content-type") || "video/mp4";
    const contentLength = response.headers.get("content-length");
    const safeFilename = filename.replace(/[^\x00-\x7F]/g, "");
    const encodedFilename = encodeURIComponent(filename);

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${safeFilename || "video.mp4"}"; filename*=UTF-8''${encodedFilename}`,
    );
    headers.set("Cache-Control", "no-store");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new NextResponse(response.body, { status: 200, headers });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
