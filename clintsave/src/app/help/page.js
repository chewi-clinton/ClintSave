"use client";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const LightbulbIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-neutral-500 shrink-0 group-open:rotate-90 transition-transform duration-200">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const browsers = [
  {
    name: "Chrome",
    color: "text-blue-400",
    steps: [
      'Click the lock icon in the address bar next to the URL',
      'Select "Site settings" from the dropdown',
      'Scroll to find "Automatic downloads"',
      'Change the setting from "Block" to "Allow"',
      'Refresh the page and try again',
    ],
    tip: 'You can also paste chrome://settings/content/automaticDownloads into your address bar directly.',
  },
  {
    name: "Firefox",
    color: "text-orange-400",
    steps: [
      'Click the lock icon in the address bar',
      'Click "Connection Secure" then "More Information"',
      'Go to the "Permissions" tab in the window that opens',
      'Find "Automatic Downloads" and uncheck "Use Default"',
      'Select "Allow" and close the window',
    ],
    tip: null,
  },
  {
    name: "Safari",
    color: "text-sky-400",
    steps: [
      'In the menu bar go to Safari → Settings',
      'Click the "Websites" tab',
      'Select "Downloads" from the left sidebar',
      'Find this site in the list and set it to "Allow"',
    ],
    tip: null,
  },
  {
    name: "Edge",
    color: "text-teal-400",
    steps: [
      'Click the lock icon in the address bar',
      'Click "Permissions for this site"',
      'Find "Automatic downloads" and set it to "Allow"',
    ],
    tip: 'You can also paste edge://settings/content/automaticDownloads into your address bar.',
  },
];

const faqs = [
  { q: "Why does only one video download?", a: "Your browser is blocking automatic multiple downloads. Follow the guide above for your browser to allow them. ClintSave downloads videos one by one with a short delay to stay within API limits." },
  { q: "Why does the profile bulk download fail?", a: "The profile lookup uses a third-party API that is sometimes blocked by Cloudflare. If it fails, copy individual video URLs and paste them into the Batch Downloader instead." },
  { q: "Are videos downloaded in HD?", a: "Yes — ClintSave requests the HD no-watermark version from the API. Quality depends on the original upload." },
  { q: "How many videos can I download at once?", a: "There is no hard limit, but the API processes one video per second. For large batches just be patient and let it run." },
  { q: "Why did a video show as Failed?", a: "The video may be private, deleted, or region-restricted. Try the URL directly in your browser to confirm it is accessible." },
];

export default function HelpPage() {
  return (
    <main className="w-full min-h-screen text-neutral-200 antialiased">
      <Navbar />

      <div className="w-full max-w-3xl mx-auto px-8 pt-12 pb-28">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">Help & Setup</h1>
          <p className="text-neutral-400 text-sm max-w-lg mx-auto leading-relaxed">
            Everything you need to get ClintSave working properly, including how to allow multiple downloads in your browser.
          </p>
        </div>

        {/* Allow multiple downloads */}
        <div className="mb-12">
          <h2 className="text-lg font-extrabold text-white mb-1.5">Allow Multiple Downloads</h2>
          <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
            By default browsers block websites from downloading multiple files automatically. You need to allow it once for ClintSave. Find your browser below:
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {browsers.map((b) => (
              <div key={b.name} className="p-5 rounded-2xl bg-white/3 border border-white/6">
                <p className={`text-sm font-extrabold mb-4 ${b.color}`}>{b.name}</p>
                <ol className="space-y-3">
                  {b.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-neutral-400">
                      <span className="w-5 h-5 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-[10px] font-bold text-neutral-500 shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                {b.tip && (
                  <div className="mt-4 flex items-start gap-2 border-t border-white/4 pt-4">
                    <LightbulbIcon />
                    <p className="text-xs text-neutral-600 leading-relaxed">{b.tip}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* How to use */}
        <div className="mb-12">
          <h2 className="text-lg font-extrabold text-white mb-6">How to Use ClintSave</h2>
          <div className="flex flex-col gap-4">
            {[
              { title: "Batch Downloader", href: "/download", desc: "Copy TikTok video URLs and paste them into the input box — one per line or space-separated. Hit Start Download and videos will save to your device automatically." },
              { title: "Profile Bulk Download", href: "/profile", desc: "Go to the Profile page, enter a TikTok username (with or without the @), and click Fetch Videos. Once loaded you can download all or save individual ones." },
            ].map((item) => (
              <div key={item.title} className="p-5 rounded-2xl bg-white/3 border border-white/6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-white">{item.title}</p>
                  <Link href={item.href} className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                    Open <ArrowIcon />
                  </Link>
                </div>
                <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-lg font-extrabold text-white mb-6">FAQ</h2>
          <div className="flex flex-col gap-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group p-5 rounded-2xl bg-white/3 border border-white/6 cursor-pointer">
                <summary className="text-sm font-bold text-white list-none flex items-center justify-between gap-4">
                  {faq.q}
                  <ChevronIcon />
                </summary>
                <p className="mt-3 text-sm text-neutral-500 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
