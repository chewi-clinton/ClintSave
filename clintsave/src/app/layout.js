import "./globals.css";

export const metadata = {
  title: "ClintSave - Premium Video Downloader",
  description: "High-throughput asynchronous video extraction.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="text-neutral-100 antialiased selection:bg-purple-500/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
