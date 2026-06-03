"use client";

import { useCallback, useMemo, useState, useRef } from "react";

const tabs = [
  { id: "session", label: "Current Session" },
  { id: "history", label: "History" },
];

function formatDate(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const VideoFileIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={className || "w-5 h-5 text-neutral-400"}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"
    />
    <rect
      x="3"
      y="6"
      width="12"
      height="12"
      rx="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-3.5 h-3.5 text-purple-400"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const HdIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-3.5 h-3.5 text-purple-400"
  >
    <rect x="2" y="7" width="20" height="10" rx="2" ry="2" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 10v4m0-2h3m0-2v4m4-4v4h2a2 2 0 002-2v0a2 2 0 00-2-2h-2z"
    />
  </svg>
);

const MusicIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-3.5 h-3.5 text-purple-400"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const LightningIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-3.5 h-3.5 text-purple-400"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-5 h-5 ml-1"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 12h14M12 5l7 7-7 7"
    />
  </svg>
);

const SpinnerIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const Badge = ({ icon, text }) => (
  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-[11px] font-medium text-neutral-400 tracking-wide">
    {icon}
    {text}
  </div>
);

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [downloads, setDownloads] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("session");
  const autoDownloadedIds = useRef(new Set());
  const downloadQueue = useRef([]);
  const isDownloading = useRef(false);

  const urlCount = useMemo(
    () =>
      inputValue.split(/[\s,\n]+/).filter((url) => url.trim().length > 0)
        .length,
    [inputValue],
  );

  const doneCount = downloads.filter((d) => d.status === "done").length;
  const totalCount = downloads.length;
  const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  function processDownloadQueue() {
    if (isDownloading.current || downloadQueue.current.length === 0) return;

    isDownloading.current = true;
    const { downloadUrl, filename } = downloadQueue.current.shift();

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Wait before triggering the next one
    setTimeout(() => {
      isDownloading.current = false;
      processDownloadQueue();
    }, 1500); // 1.5s between each download
  }

  function triggerAutoDownload(download) {
    if (!download.videoUrlNoWatermark) return;
    if (autoDownloadedIds.current.has(download.id)) return;
    autoDownloadedIds.current.add(download.id);

    const filename = `${(download.creatorName || "tiktok").replace(/[^a-z0-9\-_]/gi, "_")}-${download.id}`;
    const downloadUrl = `/api/download?url=${encodeURIComponent(download.videoUrlNoWatermark)}&filename=${encodeURIComponent(filename)}`;

    downloadQueue.current.push({ downloadUrl, filename: `${filename}.mp4` });
    processDownloadQueue();
  }

  const handleSubmit = useCallback(async () => {
    const urls = inputValue
      .split(/[\s,\n]+/)
      .map((url) => url.trim())
      .filter(
        (url) =>
          url.length > 0 &&
          (url.includes("tiktok.com") || url.includes("vm.tiktok.com")),
      );

    if (urls.length === 0) return alert("Please enter valid TikTok URLs");

    setIsProcessing(true);
    autoDownloadedIds.current = new Set();

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
              if (!updated) return download;

              if (updated.status === "done" && download.status !== "done") {
                triggerAutoDownload(updated);
              }

              return updated;
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

    setTimeout(() => clearInterval(pollInterval), 600000);
  }, []);

  return (
    <main className="w-full min-h-screen bg-[#0a0510] text-neutral-200 relative z-0 antialiased selection:bg-purple-500/30">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/15 blur-[140px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-900/5 blur-[140px]" />
      </div>

      <div className="w-full mx-auto max-w-none px-8 md:px-16 flex flex-col min-h-screen">
        <nav
          className="w-full flex items-center justify-between border-b border-white/[0.04]"
          style={{ paddingTop: "2rem", paddingBottom: "2rem" }}
        >
          <div className="text-lg font-bold tracking-tight text-white flex items-center select-none">
            <span className="text-purple-500 font-extrabold mr-[2px]">C</span>
            lint<span className="font-semibold text-neutral-400">Save</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-neutral-400">
            <a href="#" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#" className="hover:text-white transition-colors">
              How it Works
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Docs
            </a>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="text-[13px] font-semibold text-neutral-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] px-4 py-2 rounded-lg transition-all border border-white/5 active:scale-[0.98]"
              style={{ padding: "0.75rem 1.5rem", fontSize: "0.9rem" }}
            >
              Sign In
            </button>
            <button
              className="text-[13px] font-bold bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98] border border-purple-500"
              style={{ padding: "0.75rem 1.5rem", fontSize: "0.9rem" }}
            >
              Get Started
            </button>
          </div>
        </nav>

        <div
          className="w-full text-center"
          style={{ marginTop: "7rem", marginBottom: "3.5rem" }}
        >
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight mx-auto text-center">
            Download Multiple Videos at Once
          </h1>
          <div className="flex justify-center w-full">
            <p className="text-neutral-400 text-sm max-w-2xl leading-relaxed text-center">
              Paste a single link or hundreds at once. ClintSave prepares your
              downloads instantly through a fast, clean workflow.
            </p>
          </div>
        </div>

        <div className="w-full relative z-10 flex flex-col items-center">
          <div className="w-full max-w-2xl relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Paste video URLs here... (one per line or separated by spaces)"
              rows={3}
              className="w-full px-6 py-4 bg-[#0f0a19]/80 border border-purple-500/30 rounded-xl text-xs font-medium text-neutral-200 placeholder:text-neutral-700 outline-none focus:border-purple-500/60 shadow-2xl transition-all resize-none"
              disabled={isProcessing}
            />
            {urlCount > 0 && (
              <span className="absolute right-4 top-3 text-[10px] bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono px-2 py-0.5 rounded-md">
                {urlCount} Detected
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-center mt-4 opacity-80">
            <Badge icon={<CheckIcon />} text="Batch Download" />
            <Badge icon={<HdIcon />} text="HD Quality" />
            <Badge icon={<MusicIcon />} text="Audio Extraction" />
            <Badge icon={<LightningIcon />} text="Fast Processing" />
          </div>

          <div
            className="flex items-center justify-center"
            style={{
              gap: "1.25rem",
              marginTop: "2.5rem",
              position: "relative",
              zIndex: 10,
            }}
          >
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="flex items-center bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800/40 text-white font-bold transition-all active:scale-[0.97] border border-purple-400/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
              style={{
                gap: "0.625rem",
                padding: "1.125rem 3rem",
                borderRadius: "1rem",
                fontSize: "1rem",
                boxShadow: "0 20px 40px rgba(124,58,237,0.3)",
              }}
            >
              {isProcessing ? "Processing..." : "Start Download"}
              {!isProcessing && <ArrowRightIcon />}
            </button>
          </div>
        </div>

        {totalCount > 0 && (
          <div className="w-full max-w-2xl mx-auto h-1 overflow-hidden rounded-full bg-white/[0.03] mt-8">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-teal-400 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <section
          className="w-full relative z-10"
          style={{ marginTop: "7rem", marginBottom: "4rem" }}
        >
          <div className="flex gap-3 mb-6 px-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all active:scale-[0.97] border ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/20"
                    : "bg-white/[0.03] text-neutral-400 border-white/[0.06] hover:bg-white/[0.07] hover:text-neutral-200"
                }`}
                style={{ padding: "0.625rem 1.25rem", fontSize: "0.8rem" }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full flex flex-col gap-3">
            {activeTab === "session" ? (
              downloads.length > 0 ? (
                downloads.map((d) => <SessionRow key={d.id} download={d} />)
              ) : (
                <div className="py-16 text-center text-xs text-neutral-600 font-medium tracking-wide border border-dashed border-white/[0.03] rounded-xl bg-white/[0.01]">
                  Operational logs queue is empty. Awaiting links injection
                  patterns...
                </div>
              )
            ) : (
              <div className="w-full overflow-hidden rounded-xl border border-white/[0.04] bg-[#120d1a]/40 backdrop-blur-sm">
                <table className="w-full text-left text-xs text-neutral-400">
                  <thead className="bg-white/[0.01] border-b border-white/[0.04] text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold">Resource</th>
                      <th className="px-6 py-3.5 font-semibold">Target URL</th>
                      <th className="px-6 py-3.5 font-semibold">
                        Processed Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] font-medium">
                    {downloads.length > 0 ? (
                      downloads.map((d) => (
                        <tr
                          key={d.id}
                          className="transition-colors hover:bg-white/[0.01]"
                        >
                          <td className="px-6 py-4 text-white max-w-[300px] truncate">
                            {d.videoTitle || "Resolving metadata..."}
                          </td>
                          <td className="px-6 py-4 font-mono text-[11px] text-neutral-500 max-w-[400px] truncate">
                            {d.tiktokUrl}
                          </td>
                          <td className="px-6 py-4 text-neutral-400">
                            {formatDate(d.createdAt)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-16 text-center text-neutral-600 font-medium tracking-wide"
                        >
                          No previous structural storage session historical
                          instances detected.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <div className="flex-grow" />

        <footer className="w-full mt-auto border-t border-white/[0.04] py-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-neutral-500 font-medium">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-xs">
              <span className="text-purple-500 mr-[1px]">C</span>lintSave
            </span>
            <span>© 2026. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white transition-colors">
              API Docs
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Support
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

function SessionRow({ download }) {
  const isDone = download.status === "done";
  const isFailed = download.status === "failed";
  const isDownloading = download.status === "downloading";
  const isProcessing = ["pending", "fetching"].includes(download.status);

  return (
    <div className="relative group flex flex-col sm:flex-row sm:items-center justify-between rounded-xl bg-[#120d1a]/80 border border-white/[0.04] p-4 overflow-hidden transition-colors hover:bg-white/[0.02] w-full">
      {isDownloading && (
        <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-purple-500 to-teal-400 w-[78%] transition-all duration-500" />
      )}

      <div className="flex items-center gap-4 min-w-0 mb-4 sm:mb-0 w-full sm:w-auto">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.02] border border-white/[0.05]">
          {download.thumbnailUrl ? (
            <img
              src={download.thumbnailUrl}
              alt="Thumbnail"
              className="h-full w-full object-cover rounded-lg"
            />
          ) : (
            <VideoFileIcon />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white tracking-wide">
            {download.videoTitle || "Resolving resource data..."}
          </p>
          <p className="mt-1 max-w-[400px] sm:max-w-[600px] truncate text-[10px] font-mono font-medium text-neutral-500">
            {download.tiktokUrl}
          </p>
        </div>
      </div>

      <div className="flex items-center sm:ml-4 self-end sm:self-auto flex-shrink-0">
        {isDone && (
          <span className="rounded-lg bg-emerald-500/10 text-emerald-400 px-4 py-2 text-xs font-bold border border-emerald-500/20">
            ✓ Saved to Downloads
          </span>
        )}

        {isDownloading && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono font-bold text-teal-400">
              78%
            </span>
            <span className="rounded-md bg-teal-500/5 px-2.5 py-1 text-[10px] font-semibold text-teal-400 border border-teal-500/10 tracking-wide">
              Downloading
            </span>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 text-neutral-500 px-2">
            <SpinnerIcon className="w-3 h-3 animate-spin text-purple-500" />
            <span className="text-[11px] font-medium tracking-wide">
              Processing...
            </span>
          </div>
        )}

        {isFailed && (
          <span className="text-[10px] font-semibold text-red-400 bg-red-500/5 border border-red-500/10 px-2.5 py-1 rounded-md tracking-wide">
            Failed
          </span>
        )}
      </div>
    </div>
  );
}
