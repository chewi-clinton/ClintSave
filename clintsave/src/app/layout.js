import "./globals.css";

export const metadata = {
  title: "ClintSave - TikTok Video Downloader",
  description: "Download TikTok videos without watermarks",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-slate-100">{children}</body>
    </html>
  );
}
