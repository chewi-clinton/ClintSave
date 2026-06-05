"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";

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

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-neutral-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

async function runSequential(tasks, delayMs = 1200) {
  for (let i = 0; i < tasks.length; i++) {
    await tasks[i]();
    if (i < tasks.length - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
}

export default function ProfilePage() {
  const [profileInput, setProfileInput] = useState("");
  const [profileVideos, setProfileVideos] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileAuthor, setProfileAuthor] = useState(null);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");

  async function fetchProfile() {
    if (!profileInput.trim()) return;
    setProfileLoading(true);
    setProfileVideos([]);
    setProfileAuthor(null);
    setError("");
    try {
      const res = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: profileInput.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch profile");
      setProfileVideos(data.videos || []);
      setProfileAuthor(data.author || null);
    } catch (e) {
      setError(e.message || "Unable to load profile videos");
    } finally {
      setProfileLoading(false);
    }
  }

  async function downloadAllProfileVideos() {
    const toDownload = profileVideos.filter((v) => v.playUrl);
    if (toDownload.length === 0) return alert("No downloadable videos found.");
    setBulkDownloading(true);
    setBulkProgress({ done: 0, total: toDownload.length });
    const tasks = toDownload.map((video) => async () => {
      const s = (video.title || video.id).replace(/[^a-z0-9\-_]/gi, "_").slice(0, 60);
      await downloadFileAsBlob(`/api/download?url=${encodeURIComponent(video.playUrl)}&filename=${encodeURIComponent(s)}`, `${s}.mp4`);
      setBulkProgress((p) => ({ ...p, done: p.done + 1 }));
    });
    try { await runSequential(tasks, 1200); } catch (e) { console.error(e); }
    finally { setBulkDownloading(false); }
  }

  return (
    <main className="w-full min-h-screen text-neutral-200 antialiased">
      <Navbar />

      <section className="w-full max-w-3xl mx-auto px-8 pt-12 pb-28">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">Profile Bulk Download</h1>
          <p className="text-neutral-400 text-sm max-w-lg mx-auto leading-relaxed">
            Enter a TikTok username to load and bulk download their latest videos without watermark.
          </p>
        </div>

        <div className="flex gap-3 mb-6">
          <input
            value={profileInput}
            onChange={(e) => setProfileInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchProfile()}
            placeholder="@yourusername"
            className="flex-1 px-5 py-3.5 bg-white/3 border border-white/8 rounded-2xl text-sm text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-purple-500/50 transition-all"
          />
          <button
            onClick={fetchProfile}
            disabled={profileLoading}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {profileLoading ? "Fetching..." : "Fetch Videos"}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm leading-relaxed">
            {error}
          </div>
        )}

        {profileAuthor && (
          <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-white/3 border border-white/6">
            {profileAuthor.avatar
              ? <img src={profileAuthor.avatar} alt={profileAuthor.nickname} className="w-12 h-12 rounded-full object-cover shrink-0" />
              : <div className="w-12 h-12 rounded-full bg-white/5 border border-white/8 flex items-center justify-center shrink-0"><UserIcon /></div>
            }
            <div>
              <p className="text-sm font-bold text-white">{profileAuthor.nickname}</p>
              <p className="text-xs text-neutral-500 mt-0.5">@{profileAuthor.unique_id}</p>
            </div>
          </div>
        )}

        {profileVideos.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-neutral-400 font-medium">{profileVideos.length} videos loaded</span>
              <div className="flex items-center gap-3">
                {bulkDownloading && (
                  <span className="text-xs text-teal-400 font-mono tabular-nums">
                    {bulkProgress.done} / {bulkProgress.total}
                  </span>
                )}
                <button
                  onClick={downloadAllProfileVideos}
                  disabled={bulkDownloading}
                  className="btn-teal disabled:opacity-40"
                >
                  {bulkDownloading
                    ? <><SpinnerIcon className="w-3.5 h-3.5 animate-spin" /> Downloading...</>
                    : <><DownloadIcon /> Download All</>
                  }
                </button>
              </div>
            </div>

            {bulkDownloading && (
              <div className="mb-5">
                <div className="w-full h-1.5 rounded-full bg-white/4 overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }} />
                </div>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              {profileVideos.map((v) => (
                <div key={v.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/3 border border-white/6 hover:bg-white/5 transition-colors">
                  {v.thumbnail
                    ? <img src={v.thumbnail} alt={v.title || v.id} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    : <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/6 flex items-center justify-center shrink-0"><VideoFileIcon /></div>
                  }
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{v.title || "Untitled"}</p>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      {v.duration ? `${Math.floor(v.duration / 60)}:${String(v.duration % 60).padStart(2, "0")}` : "—"}
                    </p>
                    {!v.playUrl && <p className="text-[10px] text-red-400 mt-1">Unavailable</p>}
                  </div>
                  <button
                    onClick={() => {
                      if (!v.playUrl) return;
                      const s = (v.title || v.id).replace(/[^a-z0-9\-_]/gi, "_").slice(0, 60);
                      downloadFileAsBlob(`/api/download?url=${encodeURIComponent(v.playUrl)}&filename=${encodeURIComponent(s)}`, `${s}.mp4`);
                    }}
                    disabled={!v.playUrl}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white text-xs font-bold disabled:opacity-30 transition-all shrink-0"
                  >
                    <DownloadIcon /> Save
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {!profileLoading && profileVideos.length === 0 && !error && (
          <div className="py-16 text-center text-sm text-neutral-600 border border-dashed border-white/5 rounded-2xl">
            Enter a TikTok username above and click Fetch Videos
          </div>
        )}
      </section>
    </main>
  );
}
