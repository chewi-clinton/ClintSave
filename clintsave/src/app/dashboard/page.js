"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentDownloads, setRecentDownloads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/history?limit=20"),
      ]);

      const statsData = await statsRes.json();
      const historyData = await historyRes.json();

      setStats(statsData);
      setRecentDownloads(historyData.downloads || []);
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>
            <p className="text-gray-600 mt-1">Download history and metrics</p>
          </div>

          <Link
            href="/"
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          >
            Back to Downloader
          </Link>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard
            label="Total Downloads"
            value={stats?.total || 0}
            subtext="All time"
          />
          <StatCard
            label="Successful"
            value={stats?.successful || 0}
            subtext={`${stats?.successRate || 0}% success rate`}
            highlight="green"
          />
          <StatCard
            label="Today"
            value={stats?.today || 0}
            subtext="This day"
          />
          <StatCard
            label="This Month"
            value={stats?.month || 0}
            subtext="Current month"
          />
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <StatCard
            label="This Week"
            value={stats?.week || 0}
            subtext="Last 7 days"
          />
          <StatCard
            label="Failed"
            value={stats?.failed || 0}
            subtext="Total failures"
            highlight="red"
          />
          <StatCard
            label="Total Size"
            value={formatBytes(Number(stats?.totalFileSize || 0))}
            subtext="Downloaded data"
          />
        </div>

        {/* Recent Downloads Table */}
        <div className="bg-white rounded border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Recent Downloads</h2>
          </div>

          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentDownloads.map((download) => (
                <tr key={download.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={download.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 truncate max-w-md">
                      {download.videoTitle || "N/A"}
                    </div>
                    <div className="text-xs text-gray-500 font-mono truncate max-w-md">
                      {download.tiktokUrl}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {download.creatorName || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(download.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {recentDownloads.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No downloads yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subtext, highlight }) {
  const colors = {
    green: "border-l-4 border-l-green-500",
    red: "border-l-4 border-l-red-500",
    default: "border-l-4 border-l-gray-300",
  };

  const valueColors = {
    green: "text-green-600",
    red: "text-red-600",
    default: "text-gray-900",
  };

  return (
    <div
      className={`bg-white rounded border border-gray-200 p-6 ${colors[highlight] || colors.default}`}
    >
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div
        className={`text-3xl font-bold ${valueColors[highlight] || valueColors.default}`}
      >
        {value.toLocaleString()}
      </div>
      <div className="text-xs text-gray-400 mt-1">{subtext}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    pending: "bg-yellow-100 text-yellow-800",
    fetching: "bg-blue-100 text-blue-800",
    downloading: "bg-purple-100 text-purple-800",
    done: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-medium rounded ${config[status] || config.pending}`}
    >
      {status}
    </span>
  );
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
