"use client";

import { useCallback, useMemo, useState } from "react";

const tabs = [
  { id: "session", label: "Current Session" },
  { id: "history", label: "History" },
];

const statusConfig = {
  pending: { label: "Pending", dot: "bg-neutral-500" },
  fetching: { label: "Fetching", dot: "bg-blue-500 animate-pulse" },
  downloading: { label: "Downloading", dot: "bg-indigo-500 animate-pulse" },
  done: { label: "Done", dot: "bg-emerald-500" },
  failed: { label: "Failed", dot: "bg-red-500" },
};

function formatDate(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Sleek SVG Icons replacing emojis
const VideoIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className="text-neutral-500"
  >
    <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z" />
    <rect x="3" y="6" width="12" height="12" rx="2" />
  </svg>
);

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [downloads, setDownloads] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("session");

  // Fixed Regex: Now splits by spaces, newlines, tabs, and commas
  const urlCount = useMemo(
    () =>
      inputValue.split(/[\s,]+/).filter((url) => url.trim().length > 0).length,
    [inputValue],
  );

  const pendingCount = downloads.filter((d) =>
    ["pending", "fetching", "downloading"].includes(d.status),
  ).length;
  const doneCount = downloads.filter((d) => d.status === "done").length;
  const failedCount = downloads.filter((d) => d.status === "failed").length;
  const totalCount = downloads.length;
  const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const handleSubmit = useCallback(async () => {
    const urls = inputValue
      .split(/[\s,]+/)
      .map((url) => url.trim())
      .filter(
        (url) =>
          url.length > 0 &&
          (url.includes("tiktok.com") || url.includes("vm.tiktok.com")),
      );

    if (urls.length === 0) return alert("Please enter valid TikTok URLs");

    setIsProcessing(true);

    try {
      const response = await fetch("/api/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to start downloads");

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

          if (
            data.downloads.every(
              (d) => d.status === "done" || d.status === "failed",
            )
          ) {
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 2000);

    setTimeout(() => clearInterval(pollInterval), 600000); // 10 min timeout
  }, []);

  const handleDownload = (download) => {
    if (!download.videoUrlNoWatermark) return;
    const filename = `${download.creatorName || "tiktok"}-${download.id}.mp4`;
    window.location.href = `/api/download?url=${encodeURIComponent(download.videoUrlNoWatermark)}&filename=${encodeURIComponent(filename)}`;
  };

  return (
    <main className="min-h-screen bg-black text-neutral-100 font-sans selection:bg-white/30 selection:text-white">
      <div className="mx-auto max-w-5xl px-6 py-12 lg:py-20">
        <header className="mb-16">
          <h1 className="text-3xl font-medium tracking-tight text-white">
            ClintSave
          </h1>
          <p className="mt-2 text-neutral-400">
            High-performance batch processor for TikTok media.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <section className="flex flex-col gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-1 shadow-2xl backdrop-blur-sm transition-all duration-500 hover:border-white/20">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Paste URLs separated by space, newline, or comma..."
                className="min-h-[200px] w-full resize-none rounded-xl bg-transparent px-5 py-4 text-sm text-neutral-200 placeholder:text-neutral-600 outline-none font-mono focus:ring-0"
                disabled={isProcessing}
              />

              <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
                <span className="text-xs text-neutral-500 font-mono">
                  {urlCount} URL{urlCount !== 1 && "s"} detected
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setInputValue("")}
                    className="px-4 py-2 text-sm font-medium text-neutral-400 transition hover:text-white"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isProcessing || urlCount === 0}
                    className="rounded-lg bg-white px-5 py-2 text-sm font-medium text-black transition-all hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isProcessing ? "Processing..." : "Start Batch"}
                  </button>
                </div>
              </div>
            </div>

            {totalCount > 0 && (
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-white transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </section>

          <aside className="flex flex-col gap-4">
            <MetricCard label="Successful" value={doneCount} />
            <div className="grid grid-cols-2 gap-4">
              <MetricCard label="Pending" value={pendingCount} small />
              <MetricCard label="Failed" value={failedCount} small />
            </div>
          </aside>
        </div>

        <section className="mt-20">
          <div className="flex gap-6 border-b border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-white" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {activeTab === "session" ? (
              <div className="flex flex-col gap-3">
                {downloads.length > 0 ? (
                  downloads.map((d) => (
                    <SessionRow
                      key={d.id}
                      download={d}
                      onDownload={() => handleDownload(d)}
                    />
                  ))
                ) : (
                  <div className="py-20 text-center text-sm text-neutral-500">
                    Queue is empty. Waiting for URLs.
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-left text-sm text-neutral-400">
                  <thead className="bg-white/[0.02] border-b border-white/10 text-xs">
                    <tr>
                      <th className="px-6 py-4 font-medium">Resource</th>
                      <th className="px-6 py-4 font-medium">Target URL</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-transparent">
                    {downloads.length > 0 ? (
                      downloads.map((d) => (
                        <tr
                          key={d.id}
                          className="transition-colors hover:bg-white/[0.01]"
                        >
                          <td className="px-6 py-4 text-white font-medium max-w-[200px] truncate">
                            {d.videoTitle || "Resolving metadata..."}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs max-w-[300px] truncate">
                            {d.tiktokUrl}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={d.status} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-12 text-center text-neutral-500"
                        >
                          No history found.
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

function MetricCard({ label, value, small }) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/[0.02] ${small ? "p-4" : "p-6"}`}
    >
      <div className="text-xs text-neutral-500 uppercase tracking-wider">
        {label}
      </div>
      <div
        className={`mt-2 font-medium text-white ${small ? "text-2xl" : "text-5xl tracking-tight"}`}
      >
        {value}
      </div>
    </div>
  );
}

function SessionRow({ download, onDownload }) {
  const status = statusConfig[download.status] || statusConfig.pending;

  return (
    <div className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] p-4 transition-all hover:border-white/10 hover:bg-white/[0.02]">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-white/5">
          {download.thumbnailUrl ? (
            <img
              src={download.thumbnailUrl}
              alt="Thumbnail"
              className="h-full w-full object-cover rounded-lg"
            />
          ) : (
            <VideoIcon />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {download.videoTitle || "Fetching details..."}
          </p>
          <p className="mt-1 max-w-[300px] truncate font-mono text-[11px] text-neutral-500">
            {download.tiktokUrl}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 ml-4">
        <StatusBadge status={download.status} />
        {download.status === "done" && (
          <button
            onClick={onDownload}
            className="rounded-md bg-white px-4 py-1.5 text-xs font-medium text-black transition-all hover:bg-neutral-200 active:scale-95"
          >
            Download
          </button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <div className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span className="text-xs font-medium text-neutral-400">
        {config.label}
      </span>
    </div>
  );
}
