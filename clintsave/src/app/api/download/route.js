import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const filename = searchParams.get("filename") || "video.mp4";

  if (!url) {
    return NextResponse.json(
      { error: "Missing target source URL parameters" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Target video resource could not be fetched");
    }

    const contentType = response.headers.get("content-type") || "video/mp4";
    const contentLength = response.headers.get("content-length");

    const fallbackFilename = filename.replace(/[^\x00-\x7F]/g, "");
    const extendedFilename = encodeURIComponent(filename);

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${fallbackFilename || "video.mp4"}"; filename*=UTF-8''${extendedFilename}`,
    );
    headers.set("Cache-Control", "public, max-age=3600");

    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
