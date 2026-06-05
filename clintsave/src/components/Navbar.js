"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/download", label: "Downloader" },
  { href: "/profile", label: "Profile Bulk" },
  { href: "/help", label: "Help" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="w-full sticky top-0 z-50 border-b border-white/6 bg-[#0a0510]/95 backdrop-blur-sm">
      <div className="w-full max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
        <Link href="/" className="text-base font-bold tracking-tight text-white flex items-center select-none shrink-0">
          <span className="text-purple-500 font-extrabold mr-[2px]">C</span>
          lint<span className="font-semibold text-neutral-400">Save</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`hover:text-white transition-colors ${pathname === l.href ? "text-white font-semibold" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="shrink-0">
          <Link
            href="/download"
            className="btn-primary"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
