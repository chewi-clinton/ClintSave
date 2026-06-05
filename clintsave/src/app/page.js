"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const LightningIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-purple-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const HdIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-purple-400">
    <rect x="2" y="7" width="20" height="10" rx="2" ry="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10v4m0-2h3m0-2v4m4-4v4h2a2 2 0 002-2v0a2 2 0 00-2-2h-2z" />
  </svg>
);

const VideoFileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-purple-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z" />
    <rect x="3" y="6" width="12" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MusicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-purple-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 text-purple-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const features = [
  { Icon: LightningIcon, title: "Batch Download", desc: "Paste hundreds of links at once and download them all automatically." },
  { Icon: HdIcon, title: "HD No Watermark", desc: "Get the highest quality version of every video, completely watermark free." },
  { Icon: VideoFileIcon, title: "Profile Bulk", desc: "Enter any username and bulk download all their videos at once." },
  { Icon: MusicIcon, title: "Fast Processing", desc: "Videos are fetched and queued instantly with live status updates." },
];

const steps = [
  { n: "01", title: "Paste Your Links", desc: "Copy TikTok video URLs and paste them into the downloader — one per line or all at once." },
  { n: "02", title: "Hit Start Download", desc: "ClintSave fetches each video from our backend and queues them up for download." },
  { n: "03", title: "Files Save Automatically", desc: "Each video downloads to your device one by one with no watermark." },
];

export default function Landing() {
  return (
    <main className="w-full min-h-screen text-neutral-200 antialiased">
      <Navbar />

      {/* Hero */}
      <section className="w-full max-w-3xl mx-auto px-8 pt-24 pb-8 text-center">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-8">
          <span className="flex items-center gap-1.5"><CheckIcon />No watermark</span>
          <span className="text-neutral-600">·</span>
          <span className="flex items-center gap-1.5"><CheckIcon />No login</span>
          <span className="text-neutral-600">·</span>
          <span>Free</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-5 tracking-tight leading-[1.1]">
          Download TikTok Videos{" "}
          <span className="text-purple-400">Without Watermark</span>
        </h1>

        <p className="text-neutral-400 text-lg max-w-xl mx-auto leading-relaxed mb-10">
          Paste one link or hundreds. ClintSave fetches, queues, and saves every video to your device automatically.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          {/* btn-primary applies the 3D button CSS from globals.css */}
          <Link href="/download" className="btn-primary">
            Start Downloading <ArrowRightIcon />
          </Link>
          {/* btn-secondary = ghost style, scrolls to the section below */}
          <a href="#how-it-works" className="btn-secondary">
            How it Works
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="w-full max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl bg-white/3 border border-white/6 hover:bg-white/5 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/15 flex items-center justify-center mb-4">
                <Icon />
              </div>
              <p className="text-sm font-bold text-white mb-2">{title}</p>
              <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="w-full max-w-3xl mx-auto px-8">
        <h2 className="text-2xl font-extrabold text-white mb-8 text-center">How it Works</h2>

        {/* step-card and step-number map to the CSS classes in globals.css */}
        <div className="flex flex-col">
          {steps.map((s) => (
            <div key={s.n} className="step-card">
              <span className="step-number">{s.n}</span>
              <div>
                <p className="text-base font-bold text-white mb-1.5">{s.title}</p>
                <p className="text-sm text-neutral-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10 mb-4">
          <Link href="/download" className="btn-primary">
            Try it Now <ArrowRightIcon />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="w-full max-w-6xl mx-auto px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-medium">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-sm">
              <span className="text-purple-500">C</span>lintSave
            </span>
            <span>© 2026. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/help" className="hover:text-white transition-colors">Help</Link>
            <Link href="/download" className="hover:text-white transition-colors">Downloader</Link>
            <Link href="/profile" className="hover:text-white transition-colors">Profile Bulk</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
