"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    today: 0,
    week: 0,
    successRate: "0.0",
    totalFileSize: 0,
  });
  const [recentDownloads, setRecentDownloads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const statsRes = await fetch("/api/stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error(error);
      }

      try {
        const historyRes = await fetch("/api/history?limit=20");
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setRecentDownloads(historyData.downloads || []);
        }
      } catch (error) {
        console.error(error);
      }

      setIsLoading(false);
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-neutral-500 text-sm">
        <span className="animate-pulse">Loading workspace...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100 font-sans">
      <div className="max-w-5xl mx-auto px-6 py-12 lg:py-20">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-white">
              System Analytics
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Global metrics and recent activity
            </p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            ← Back to Application
          </Link>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatCard label="Total Processed" value={stats.total} />
          <StatCard label="Successful" value={stats.successful} />
          <StatCard label="Success Rate" value={`${stats.successRate}%`} />
          <StatCard label="Failed" value={stats.failed} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          <StatCard label="Today" value={stats.today} secondary />
          <StatCard label="This Week" value={stats.week} secondary />
          <StatCard
            label="Data Transfer"
            value={formatBytes(stats.totalFileSize)}
            secondary
          />
        </div>

        <div>
          <h2 className="text-sm font-medium text-white mb-4">
            Recent Executions
          </h2>
          <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.01]">
            <table className="w-full text-left text-sm text-neutral-400">
              <thead className="border-b border-white/10 text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Identifier</th>
                  <th className="px-6 py-4 font-medium">Creator</th>
                  <th className="px-6 py-4 font-medium text-right">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {recentDownloads.map((download) => (
                  <tr
                    key={download.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`capitalize ${download.status === "failed" ? "text-red-400" : download.status === "done" ? "text-emerald-400" : "text-neutral-400"}`}
                      >
                        {download.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white truncate max-w-[200px]">
                        {download.videoTitle || "N/A"}
                      </div>
                      <div className="text-[11px] font-mono mt-1 truncate max-w-[200px]">
                        {download.tiktokUrl}
                      </div>
                    </td>
                    <td className="px-6 py-4">{download.creatorName || "—"}</td>
                    <td className="px-6 py-4 text-right font-mono text-[11px]">
                      {new Date(download.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, secondary }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:border-white/20">
      <div className="text-xs text-neutral-500 mb-2">{label}</div>
      <div
        className={`font-medium text-white ${secondary ? "text-2xl" : "text-3xl tracking-tight"}`}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

// Explicit formatting function replaces dependencies
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
