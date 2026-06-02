"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";

const tabs = [
  { id: "session", label: "Current Session" },
  { id: "history", label: "History" },
];

const statusConfig = {
  pending: {
    label: "Pending",
    badge: "border-[#2a2a2a] bg-[#141414] text-[#f8fafc]",
    tone: "text-[#fbbf24]",
  },
  fetching: {
    label: "Fetching",
    badge: "border-[#2a2a2a] bg-[#141414] text-[#fe2c55]",
    tone: "text-[#fe2c55]",
  },
  downloading: {
    label: "Downloading",
    badge: "border-[#2a2a2a] bg-[#141414] text-[#fe2c55]",
    tone: "text-[#fe2c55]",
  },
  done: {
    label: "Done",
    badge: "border-[#2a2a2a] bg-[#141414] text-[#10b981]",
    tone: "text-[#10b981]",
  },
  failed: {
    label: "Failed",
    badge: "border-[#2a2a2a] bg-[#141414] text-[#ef4444]",
    tone: "text-[#ef4444]",
  },
};

function formatDate(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [downloads, setDownloads] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [activeTab, setActiveTab] = useState("session");

  const urlCount = useMemo(
    () =>
      inputValue
        .split(/[\n,]+/)
        .map((url) => url.trim())
        .filter((url) => url.length > 0).length,
    [inputValue],
  );

  const pendingCount = downloads.filter(
    (d) => d.status === "pending" || d.status === "fetching",
  ).length;
  const doneCount = downloads.filter((d) => d.status === "done").length;
  const failedCount = downloads.filter((d) => d.status === "failed").length;
  const totalCount = downloads.length;
  const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const handleClear = () => setInputValue("");

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

    setTimeout(() => clearInterval(pollInterval), 600000);
  }, []);

  const handleDownload = (download) => {
    if (!download.videoUrlNoWatermark) return;

    const filename = `${download.creatorName || "tiktok"}-${download.id}.mp4`;
    window.location.href = `/api/download?url=${encodeURIComponent(download.videoUrlNoWatermark)}&filename=${encodeURIComponent(filename)}`;
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-slate-100">
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-[#2a2a2a] bg-[#141414] text-[#fe2c55] shadow-sm shadow-black/20">
              <span className="text-2xl font-black">C</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                TikTok downloader
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
                ClintSave
              </h1>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-[#2a2a2a] bg-[#141414] px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-[#fe2c55] hover:text-white"
          >
            Statistics
          </Link>
        </header>

        <div className="mt-10 grid gap-6 xl:grid-cols-[2fr_1.1fr]">
          <section className="rounded-[32px] border border-[#2a2a2a] bg-[#141414] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.2)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500">
                  Batch downloader
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Paste TikTok links and start the queue.
                </h2>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#0f0f0f] px-4 py-2 text-xs text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full bg-[#fe2c55]" />5
                videos processed at a time
              </div>
            </div>

            <label className="mt-6 block text-sm font-medium text-slate-300">
              Paste multiple TikTok URLs, one per line
            </label>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="https://www.tiktok.com/@creator/video/1234567890123456789"
              className="mt-3 min-h-[260px] w-full rounded-3xl border border-[#2a2a2a] bg-[#0f0f0f] px-4 py-4 text-sm text-slate-100 outline-none transition focus:border-[#fe2c55] focus:ring-2 focus:ring-[#fe2c55]/20 font-mono"
              disabled={isProcessing}
            />

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-400">
                {urlCount} URL{urlCount === 1 ? "" : "s"} detected
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-full border border-[#2a2a2a] bg-[#0f0f0f] px-4 py-2 text-sm text-slate-300 transition hover:border-[#fe2c55] hover:text-white"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isProcessing || urlCount === 0}
                  className="rounded-full bg-[#fe2c55] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(254,44,85,0.25)] transition disabled:cursor-not-allowed disabled:bg-[#7c1e30]"
                >
                  {isProcessing ? "Starting…" : "Start Download"}
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-full bg-[#0f0f0f] p-4 border border-[#2a2a2a]">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-slate-500">
                <span>Progress</span>
                <span>{progress}% complete</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#0a0a0a] border border-[#2a2a2a]">
                <div
                  className="h-3 rounded-full bg-[#fe2c55] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </section>

          <aside className="grid gap-4">
            <div className="rounded-[28px] border border-[#2a2a2a] bg-[#141414] p-5">
              <div className="text-xs uppercase tracking-[0.35em] text-slate-500">
                Total downloaded
              </div>
              <div className="mt-4 text-4xl font-semibold text-white">
                {doneCount}
              </div>
              <div className="mt-2 text-sm text-slate-400">
                Saved across sessions
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard
                label="Successful"
                value={doneCount}
                tone="text-[#10b981]"
              />
              <MetricCard
                label="Failed"
                value={failedCount}
                tone="text-[#ef4444]"
              />
              <MetricCard
                label="Pending"
                value={pendingCount}
                tone="text-[#fe2c55]"
              />
              <MetricCard
                label="This session"
                value={totalCount}
                tone="text-slate-100"
              />
            </div>
          </aside>
        </div>

        <section className="mt-10">
          <div className="grid grid-cols-2 gap-2 rounded-full border border-[#2a2a2a] bg-[#141414] p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-[#0a0a0a] text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-[32px] border border-[#2a2a2a] bg-[#141414] p-6">
            {activeTab === "session" ? (
              <div className="space-y-4">
                {downloads.length > 0 ? (
                  downloads.map((download) => (
                    <SessionCard
                      key={download.id}
                      download={download}
                      onDownload={() => handleDownload(download)}
                    />
                  ))
                ) : (
                  <div className="rounded-[28px] border border-dashed border-[#2a2a2a] bg-[#0f0f0f] px-8 py-12 text-center text-slate-500">
                    <p className="mb-2 text-lg font-semibold text-slate-200">
                      No active downloads yet
                    </p>
                    <p>
                      Paste TikTok URLs above to see your current session queue.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-[0.35em] text-slate-500">
                      <th className="px-4 py-4">Video</th>
                      <th className="px-4 py-4">URL</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {downloads.length > 0 ? (
                      downloads.map((download) => (
                        <tr
                          key={download.id}
                          className="border-t border-[#2a2a2a]"
                        >
                          <td className="px-4 py-4 align-top">
                            <div className="flex items-center gap-3">
                              <div className="h-14 w-14 overflow-hidden rounded-3xl bg-[#0f0f0f]">
                                {download.thumbnailUrl ? (
                                  <img
                                    src={download.thumbnailUrl}
                                    alt={
                                      download.videoTitle || "Video thumbnail"
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-slate-600">
                                    🎬
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">
                                  {download.videoTitle || "Untitled clip"}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {download.creatorName || "@unknown"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="max-w-[260px] truncate font-mono text-xs text-slate-400">
                              {download.tiktokUrl}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${statusConfig[download.status]?.badge || statusConfig.pending.badge}`}
                            >
                              {statusConfig[download.status]?.label ||
                                "Pending"}
                            </span>
                          </td>
                          <td className="px-4 py-4 align-top text-sm text-slate-400">
                            {formatDate(download.createdAt)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-12 text-center text-slate-500"
                        >
                          No history available yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value, tone }) {
  return (
    <div className="rounded-[28px] border border-[#2a2a2a] bg-[#0f0f0f] p-5">
      <div className={`text-4xl font-semibold ${tone} text-white`}>{value}</div>
      <div className="mt-3 text-xs uppercase tracking-[0.35em] text-slate-500">
        {label}
      </div>
    </div>
  );
}

function SessionCard({ download, onDownload }) {
  const status = statusConfig[download.status] || statusConfig.pending;
  const active =
    download.status === "fetching" || download.status === "downloading";

  return (
    <div className="flex flex-col gap-4 rounded-[30px] border border-[#2a2a2a] bg-[#0f0f0f] p-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-[#141414]">
        {download.thumbnailUrl ? (
          <img
            src={download.thumbnailUrl}
            alt={download.videoTitle || "Thumbnail"}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xl text-slate-500">🎥</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-white">
          {download.videoTitle || "Loading video details..."}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          <span className="text-[#fe2c55]">
            {download.creatorName || "@creator"}
          </span>
        </p>
        <p className="mt-3 max-w-full truncate text-xs font-mono text-slate-500">
          {download.tiktokUrl}
        </p>
      </div>
      <div className="flex flex-col items-start gap-3 sm:items-end">
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold ${status.badge}`}
        >
          {active ? (
            <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-slate-500 border-t-white" />
          ) : null}
          {status.label}
        </div>
        {download.status === "done" ? (
          <button
            type="button"
            onClick={onDownload}
            className="rounded-full bg-[#fe2c55] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-[#ff4d70]"
          >
            Save
          </button>
        ) : download.status === "failed" ? (
          <span className="text-xs text-[#ef4444]">Try again later</span>
        ) : null}
      </div>
    </div>
  );
}
