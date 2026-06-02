import "./globals.css";

export const metadata = {
  title: "ClintSave - TikTok Video Downloader",
  description: "Download TikTok videos without watermarks",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Umami Analytics Script */}
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <script
            defer
            src={`${process.env.NEXT_PUBLIC_UMAMI_URL}/script.js`}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          />
        )}

        {children}
      </body>
    </html>
  );
}
