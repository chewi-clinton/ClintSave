"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [downloads, setDownloads] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState("");

  const handleSubmit = useCallback(async () => {
    const urls = inputValue
      .split(/[\n,]+/)
      .map((url) => url.trim())
      .filter(
        (url) =>
          url.length > 0 &&
          (url.includes("tiktok.com") || url.includes("vm.tiktok.com")),
      );

    if (urls.length === 0) {
      alert("Please enter valid TikTok URLs");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start downloads");
      }

      setCurrentSessionId(data.sessionId);

      // Initialize cards
      const initialDownloads = urls.map((url, index) => ({
        id: data.downloadIds[index],
        tiktokUrl: url,
        status: "pending",
        createdAt: new Date().toISOString(),
      }));

      setDownloads((prev) => [...initialDownloads, ...prev]);
      setInputValue("");

      startPolling(data.sessionId);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [inputValue]);

  const startPolling = useCallback((sessionId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/status?sessionId=${sessionId}`);
        const data = await response.json();

        if (response.ok) {
          setDownloads((prev) =>
            prev.map((download) => {
              const updated = data.downloads.find((d) => d.id === download.id);
              return updated || download;
            }),
          );

          const allComplete = data.downloads.every(
            (d) => d.status === "done" || d.status === "failed",
          );

          if (allComplete) {
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 2000);

    setTimeout(() => clearInterval(pollInterval), 600000); // 10 min max
  }, []);

  const handleDownload = (download) => {
    if (!download.videoUrlNoWatermark) return;

    const filename = `${download.creatorName || "tiktok"}-${download.id}.mp4`;
    window.location.href = `/api/download?url=${encodeURIComponent(download.videoUrlNoWatermark)}&filename=${encodeURIComponent(filename)}`;
  };

  const pendingCount = downloads.filter(
    (d) => d.status === "pending" || d.status === "fetching",
  ).length;
  const doneCount = downloads.filter((d) => d.status === "done").length;
  const failedCount = downloads.filter((d) => d.status === "failed").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ClintSave</h1>
            <p className="text-gray-600 mt-1">TikTok Video Downloader</p>
          </div>

          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          >
            Statistics
          </Link>
        </header>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Paste TikTok URLs (one per line)
          </label>

          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`https://www.tiktok.com/@user/video/1234567890\nhttps://vm.tiktok.com/ZMxxxxxx/\nhttps://www.tiktok.com/@user/video/0987654321`}
            className="w-full h-40 p-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none outline-none text-sm font-mono"
            disabled={isProcessing}
          />

          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-gray-500">
              {inputValue
                ? `${inputValue.split(/[\n,]+/).filter((u) => u.trim()).length} URLs detected`
                : ""}
            </span>

            <button
              onClick={handleSubmit}
              disabled={isProcessing || !inputValue.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isProcessing
                ? "Processing..."
                : `Download All (${inputValue.split(/[\n,]+/).filter((u) => u.trim()).length} videos)`}
            </button>
          </div>

          {/* Optional Webhook Input */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-xs text-gray-600 mb-2">
              Optional: Webhook URL for completion notification
            </label>
            <input
              type="text"
              placeholder="https://your-webhook-url.com/endpoint"
              className="w-full p-2 border border-gray-300 rounded text-xs font-mono outline-none focus:ring-1 focus:ring-blue-500"
              onChange={(e) => {
                // Store webhook URL temporarily (you'd want to manage this properly)
              }}
            />
          </div>
        </div>

        {/* Status Summary */}
        {(downloads.length > 0 || isProcessing) && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded border border-gray-200">
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                Pending
              </div>
              <div className="text-2xl font-bold text-yellow-600 mt-1">
                {pendingCount}
              </div>
            </div>
            <div className="bg-white p-4 rounded border border-gray-200">
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                Completed
              </div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {doneCount}
              </div>
            </div>
            <div className="bg-white p-4 rounded border border-gray-200">
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                Failed
              </div>
              <div className="text-2xl font-bold text-red-600 mt-1">
                {failedCount}
              </div>
            </div>
          </div>
        )}

        {/* Downloads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {downloads.map((download) => (
            <DownloadCard
              key={download.id}
              download={download}
              onDownload={() => handleDownload(download)}
            />
          ))}
        </div>

        {downloads.length === 0 && !isProcessing && (
          <div className="text-center py-20 text-gray-400">
            <p>No downloads yet. Paste TikTok URLs above to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DownloadCard({ download, onDownload }) {
  const statusConfig = {
    pending: {
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    },
    fetching: {
      label: "Fetching",
      color: "bg-blue-100 text-blue-800 border-blue-300",
    },
    downloading: {
      label: "Ready",
      color: "bg-purple-100 text-purple-800 border-purple-300",
    },
    done: {
      label: "Done",
      color: "bg-green-100 text-green-800 border-green-300",
    },
    failed: {
      label: "Failed",
      color: "bg-red-100 text-red-800 border-red-300",
    },
  };

  const config = statusConfig[download.status] || statusConfig.pending;

  return (
    <div
      className={`bg-white rounded border ${config.color.split(" ")[2]} overflow-hidden`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100">
        {download.thumbnailUrl ? (
          <img
            src={download.thumbnailUrl}
            alt={download.videoTitle || "Video"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded border ${config.color}`}
          >
            {config.label}
          </span>
        </div>

        {/* Duration */}
        {download.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {Math.floor(download.duration / 60)}:
            {(download.duration % 60).toString().padStart(2, "0")}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-2 text-sm mb-2 min-h-[40px]">
          {download.videoTitle || "Loading..."}
        </h3>

        <p className="text-xs text-gray-500 mb-3">
          {download.creatorName || "Unknown"}
        </p>

        {/* Action Button */}
        <div>
          {download.status === "done" && (
            <button
              onClick={onDownload}
              className="w-full px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
            >
              Download Video
            </button>
          )}

          {download.status === "failed" && (
            <div className="w-full px-4 py-2 bg-red-50 text-red-700 rounded text-xs text-center">
              {download.errorMessage || "Download failed"}
            </div>
          )}

          {["pending", "fetching", "downloading"].includes(download.status) && (
            <div className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded text-xs text-center animate-pulse">
              {download.status === "pending" && "Waiting..."}
              {download.status === "fetching" && "Fetching info..."}
              {download.status === "downloading" && "Ready to download"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
