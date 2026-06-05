"use client";
import { useCallback, useMemo, useState, useRef } from "react";
import Navbar from "@/components/Navbar";

function formatDate(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const SpinnerIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const VideoFileIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className || "w-5 h-5 text-neutral-500"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z" />
    <rect x="3" y="6" width="12" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-emerald-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-red-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

async function downloadFileAsBlob(proxyUrl, filename) {
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
}

const tabs = [{ id: "session", label: "Current Session" }, { id: "history", label: "History" }];

export default function DownloadPage() {
  const [inputValue, setInputValue] = useState("");
  const [downloads, setDownloads] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("session");
  const autoDownloadedIds = useRef(new Set());
  const downloadQueue = useRef([]);
  const isQueueRunning = useRef(false);

  const urlCount = useMemo(() => inputValue.split(/[\s,\n]+/).filter((u) => u.trim().length > 0).length, [inputValue]);
  const doneCount = downloads.filter((d) => d.status === "done").length;
  const totalCount = downloads.length;
  const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  async function processDownloadQueue() {
    if (isQueueRunning.current) return;
    isQueueRunning.current = true;
    while (downloadQueue.current.length > 0) {
      const { proxyUrl, filename } = downloadQueue.current.shift();
      try { await downloadFileAsBlob(proxyUrl, filename); } catch (e) { console.error("Download failed:", e.message); }
      if (downloadQueue.current.length > 0) await new Promise((r) => setTimeout(r, 1500));
    }
    isQueueRunning.current = false;
  }

  function triggerAutoDownload(download) {
    if (!download.videoUrlNoWatermark) return;
    if (autoDownloadedIds.current.has(download.id)) return;
    autoDownloadedIds.current.add(download.id);
    const filename = `${(download.creatorName || "tiktok").replace(/[^a-z0-9\-_]/gi, "_")}-${download.id}`;
    const proxyUrl = `/api/download?url=${encodeURIComponent(download.videoUrlNoWatermark)}&filename=${encodeURIComponent(filename)}`;
    downloadQueue.current.push({ proxyUrl, filename: `${filename}.mp4` });
    processDownloadQueue();
  }

  const handleSubmit = useCallback(async () => {
    const urls = inputValue.split(/[\s,\n]+/).map((u) => u.trim()).filter((u) => u.length > 0 && (u.includes("tiktok.com") || u.includes("vm.tiktok.com")));
    if (urls.length === 0) return alert("Please enter valid TikTok URLs");
    setIsProcessing(true);
    autoDownloadedIds.current = new Set();
    downloadQueue.current = [];
    isQueueRunning.current = false;
    try {
      const response = await fetch("/api/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ urls }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to start downloads");
      const initialDownloads = urls.map((url, index) => ({ id: data.downloadIds[index], tiktokUrl: url, status: "pending", createdAt: new Date().toISOString() }));
      setDownloads((prev) => [...initialDownloads, ...prev]);
      setInputValue("");
      startPolling(data.sessionId);
    } catch (error) { alert(error.message); }
    finally { setIsProcessing(false); }
  }, [inputValue]);

  const startPolling = useCallback((sessionId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/status?sessionId=${sessionId}`);
        const data = await response.json();
        if (response.ok) {
          setDownloads((prev) => prev.map((download) => {
            const updated = data.downloads.find((d) => d.id === download.id);
            if (!updated) return download;
            if (updated.status === "done" && download.status !== "done") triggerAutoDownload(updated);
            return updated;
          }));
          if (data.downloads.every((d) => d.status === "done" || d.status === "failed")) clearInterval(pollInterval);
        }
      } catch (e) { console.error("Polling error:", e); }
    }, 2000);
    setTimeout(() => clearInterval(pollInterval), 600000);
  }, []);

  return (
    <main className="w-full min-h-screen text-neutral-200 antialiased">
      <Navbar />

      <section className="w-full max-w-3xl mx-auto px-8 pt-12 pb-28">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">Batch Downloader</h1>
          <p className="text-neutral-400 text-sm max-w-lg mx-auto leading-relaxed">
            Paste one or more TikTok video URLs below. Videos download automatically one by one.
          </p>
        </div>

        <div className="relative mb-4">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Paste video URLs here... (one per line or separated by spaces)"
            rows={5}
            className="w-full px-5 py-4 bg-white/3 border border-white/8 rounded-2xl text-sm text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-purple-500/50 transition-all resize-none"
            disabled={isProcessing}
          />
          {urlCount > 0 && (
            <span className="absolute right-4 top-3.5 text-[11px] bg-purple-500/15 border border-purple-500/25 text-purple-300 font-semibold px-2.5 py-1 rounded-lg">
              {urlCount} URL{urlCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex justify-center mb-8">
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing
              ? <><SpinnerIcon className="w-4 h-4 animate-spin" /> Processing...</>
              : <>Start Download <ArrowRightIcon /></>
            }
          </button>
        </div>

        {totalCount > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
              <span>{doneCount} of {totalCount} done</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 overflow-hidden rounded-full bg-white/4">
              <div className="h-full bg-purple-500 transition-all duration-700 ease-out rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-5 mt-7">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white border-purple-500"
                  : "bg-white/3 text-neutral-400 border-white/7 hover:bg-white/6 hover:text-neutral-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {activeTab === "session" ? (
            downloads.length > 0
              ? downloads.map((d) => <SessionRow key={d.id} download={d} />)
              : (
                <div className="py-16 text-center text-sm text-neutral-600 border border-dashed border-white/5 rounded-2xl">
                  No downloads yet. Paste some URLs above.
                </div>
              )
          ) : (
            <div className="rounded-2xl border border-white/6 bg-white/2 overflow-hidden">
              <table className="w-full text-left text-xs text-neutral-400">
                <thead className="border-b border-white/6 text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Title</th>
                    <th className="px-5 py-3.5">URL</th>
                    <th className="px-5 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {downloads.length > 0 ? downloads.map((d) => (
                    <tr key={d.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-5 py-4 text-white max-w-50 truncate">{d.videoTitle || "—"}</td>
                      <td className="px-5 py-4 font-mono text-[10px] text-neutral-500 max-w-75 truncate">{d.tiktokUrl}</td>
                      <td className="px-5 py-4 whitespace-nowrap">{formatDate(d.createdAt)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="px-5 py-16 text-center text-neutral-600">No history yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function SessionRow({ download }) {
  const isDone = download.status === "done";
  const isFailed = download.status === "failed";
  const isProcessing = ["pending", "fetching"].includes(download.status);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl bg-white/3 border border-white/6 p-4 gap-3 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/4 border border-white/6 overflow-hidden">
          {download.thumbnailUrl
            ? <img src={download.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            : <VideoFileIcon />
          }
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{download.videoTitle || "Fetching..."}</p>
          <p className="mt-0.5 truncate text-[11px] font-mono text-neutral-500 max-w-xs">{download.tiktokUrl}</p>
        </div>
      </div>

      <div className="self-end sm:self-auto shrink-0">
        {isDone && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 px-3.5 py-2 text-xs font-bold border border-emerald-500/20">
            <CheckCircleIcon /> Saved
          </span>
        )}
        {isProcessing && (
          <div className="flex items-center gap-2 text-neutral-500">
            <SpinnerIcon className="w-3.5 h-3.5 animate-spin text-purple-400" />
            <span className="text-xs font-medium">Processing...</span>
          </div>
        )}
        {isFailed && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/8 border border-red-500/15 px-3 py-2 rounded-lg">
            <XCircleIcon /> Failed
          </span>
        )}
      </div>
    </div>
  );
}
