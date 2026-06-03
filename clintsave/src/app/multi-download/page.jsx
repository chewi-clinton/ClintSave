"use client";
import { useEffect, useState } from "react";

export default function AllowDownloads() {
  const [browser, setBrowser] = useState("chrome");

  useEffect(() => {
    const ua = navigator.userAgent;
    if (ua.includes("Firefox")) setBrowser("firefox");
    else if (ua.includes("Edg/")) setBrowser("edge");
    else if (ua.includes("Safari") && !ua.includes("Chrome"))
      setBrowser("safari");
    else setBrowser("chrome");
  }, []);

  const steps = {
    chrome: {
      name: "Chrome",
      steps: [
        "Click the lock icon 🔒 in the address bar",
        'Select "Site settings"',
        'Find "Automatic downloads" and set it to "Allow"',
      ],
      settingsUrl: "chrome://settings/content/automaticDownloads",
    },
    firefox: {
      name: "Firefox",
      steps: [
        "Click the lock icon in the address bar",
        'Click "Connection Secure" → "More Information"',
        'Go to the "Permissions" tab',
        'Uncheck "Use Default" next to "Automatic Downloads" and select "Allow"',
      ],
    },
    edge: {
      name: "Edge",
      steps: [
        "Click the lock icon in the address bar",
        'Click "Permissions for this site"',
        'Find "Automatic downloads" and set to "Allow"',
      ],
      settingsUrl: "edge://settings/content/automaticDownloads",
    },
    safari: {
      name: "Safari",
      steps: [
        "Go to Safari → Settings → Websites",
        'Click "Downloads" in the sidebar',
        'Find this site and set it to "Allow"',
      ],
    },
  };

  const current = steps[browser];

  return (
    <main className="min-h-screen bg-[#0a0510] text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#120d1a] border border-white/10 rounded-2xl p-8">
        <h1 className="text-xl font-bold mb-2">Allow Multiple Downloads</h1>
        <p className="text-neutral-400 text-sm mb-6">
          {current.name} blocked automatic downloads. Follow these steps to
          allow them for this site:
        </p>
        <ol className="space-y-3">
          {current.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-neutral-300">{step}</span>
            </li>
          ))}
        </ol>
        {current.settingsUrl && (
          <p className="mt-6 text-xs text-neutral-500">
            Or copy this into your address bar:{" "}
            <code className="text-purple-400">{current.settingsUrl}</code>
          </p>
        )}
        <button
          onClick={() => window.history.back()}
          className="mt-6 w-full bg-purple-600 hover:bg-purple-500 py-2.5 rounded-lg text-sm font-bold transition-colors"
        >
          Done, go back
        </button>
      </div>
    </main>
  );
}
