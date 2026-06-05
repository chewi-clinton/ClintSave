"use client";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";

const LightbulbIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const browserGuides = {
  chrome: {
    name: "Google Chrome",
    color: "text-blue-400",
    steps: [
      'Click the lock icon in the address bar',
      'Select "Site settings"',
      'Find "Automatic downloads" and set it to "Allow"',
      'Refresh the page and try again',
    ],
    tip: "You can also go to chrome://settings/content/automaticDownloads directly.",
  },
  firefox: {
    name: "Mozilla Firefox",
    color: "text-orange-400",
    steps: [
      'Click the lock icon in the address bar',
      'Click "Connection Secure" then "More Information"',
      'Open the "Permissions" tab',
      'Find "Automatic Downloads", uncheck "Use Default", and select "Allow"',
    ],
    tip: null,
  },
  edge: {
    name: "Microsoft Edge",
    color: "text-teal-400",
    steps: [
      'Click the lock icon in the address bar',
      'Click "Permissions for this site"',
      'Set "Automatic downloads" to "Allow"',
    ],
    tip: "You can also go to edge://settings/content/automaticDownloads directly.",
  },
  safari: {
    name: "Apple Safari",
    color: "text-sky-400",
    steps: [
      'Open Safari → Settings in the menu bar',
      'Click the "Websites" tab',
      'Select "Downloads" from the sidebar',
      'Find this site and set it to "Allow"',
    ],
    tip: null,
  },
};

export default function AllowDownloads() {
  const [browser, setBrowser] = useState("chrome");

  useEffect(() => {
    const ua = navigator.userAgent;
    if (ua.includes("Firefox")) setBrowser("firefox");
    else if (ua.includes("Edg/")) setBrowser("edge");
    else if (ua.includes("Safari") && !ua.includes("Chrome")) setBrowser("safari");
    else setBrowser("chrome");
  }, []);

  const guide = browserGuides[browser];

  return (
    <main className="w-full min-h-screen text-neutral-200 antialiased">
      <Navbar />

      <div className="w-full max-w-lg mx-auto px-8 pt-12 pb-28">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Allow Multiple Downloads</h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Your browser is blocking automatic downloads. Follow the steps below for{" "}
            <span className={`font-semibold ${guide.color}`}>{guide.name}</span> to allow them.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/3 border border-white/6 mb-6">
          <p className={`text-sm font-extrabold mb-5 ${guide.color}`}>{guide.name}</p>
          <ol className="space-y-3.5">
            {guide.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-neutral-300">
                <span className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          {guide.tip && (
            <div className="mt-5 flex items-start gap-2 border-t border-white/4 pt-5">
              <LightbulbIcon />
              <p className="text-xs text-neutral-600 leading-relaxed">{guide.tip}</p>
            </div>
          )}
        </div>

        <button
          onClick={() => window.history.back()}
          className="btn-primary w-full justify-center py-4 bg-purple-600 hover:bg-purple-500 text-sm"
        >
          <ArrowLeftIcon />
          Done — Go Back
        </button>
      </div>
    </main>
  );
}
