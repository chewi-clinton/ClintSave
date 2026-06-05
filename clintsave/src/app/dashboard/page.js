"use client";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";

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

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-neutral-500">
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
  </svg>
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 1420, successful: 1392, failed: 28, today: 142, week: 894, successRate: "98.0", totalFileSize: 4218392019
  });
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const r1 = await fetch("/api/stats");
        if (r1.ok) setStats(await r1.json());
        const r2 = await fetch("/api/history?limit=15");
        if (r2.ok) {
          const d2 = await r2.json();
          setHistory(d2.downloads || []);
        }
      } catch (e) { console.error(e); }
      setIsLoading(false);
    }
    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-500 text-sm">
        Loading...
      </div>
    );
  }

  return (
    <main className="w-full min-h-screen text-neutral-200 antialiased">
      <Navbar />

      <div className="w-full max-w-4xl mx-auto px-8 pt-12 pb-28">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Analytics</h1>
          <p className="text-neutral-500 text-sm mt-1">Download stats and history.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <MetricCard title="Total Downloads" value={stats.total} />
          <MetricCard title="Successful" value={stats.successful} />
          <MetricCard title="Success Rate" value={`${stats.successRate}%`} accent="teal" />
          <MetricCard title="Failed" value={stats.failed} accent={stats.failed > 0 ? "red" : null} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <MetricCard title="Today" value={stats.today} small />
          <MetricCard title="This Week" value={stats.week} small />
          <MetricCard title="Total Size" value={formatBytes(stats.totalFileSize)} small />
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-4">Download History</h2>
          <div className="rounded-2xl border border-white/6 bg-white/2 overflow-hidden">
            <table className="w-full text-left text-xs text-neutral-400">
              <thead className="border-b border-white/6 text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Video</th>
                  <th className="px-5 py-3.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {history.length > 0 ? history.map((h) => (
                  <tr key={h.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 font-semibold">
                        {h.status === "done"
                          ? <><CheckCircleIcon /><span className="text-emerald-400">Done</span></>
                          : h.status === "failed"
                            ? <><XCircleIcon /><span className="text-red-400">Failed</span></>
                            : <><ClockIcon /><span className="text-neutral-500">{h.status}</span></>
                        }
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-white max-w-xs truncate text-sm">{h.videoTitle || "—"}</div>
                      <div className="text-[10px] text-neutral-500 truncate max-w-xs mt-0.5">{h.tiktokUrl}</div>
                    </td>
                    <td className="px-5 py-4 text-right text-neutral-500 whitespace-nowrap">
                      {new Date(h.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-5 py-12 text-center text-neutral-600">No downloads yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ title, value, accent, small }) {
  const valueColor = accent === "teal" ? "text-teal-400" : accent === "red" ? "text-red-400" : "text-white";
  return (
    <div className="p-5 rounded-2xl bg-white/3 border border-white/6">
      <p className="text-xs text-neutral-500 mb-2">{title}</p>
      <p className={`font-bold ${valueColor} ${small ? "text-xl" : "text-2xl"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
