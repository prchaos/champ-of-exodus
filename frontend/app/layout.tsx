import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import "./globals.css";

// Font files are bundled in app/fonts/ rather than fetched from Google at build
// time — next/font/google's build-time fetch fails intermittently in CI.
const displayFont = localFont({
  src: "./fonts/cinzel-variable.woff2",
  variable: "--font-display",
  weight: "600 800",
});

const bodyFont = localFont({
  src: [
    { path: "./fonts/rajdhani-400.woff2", weight: "400" },
    { path: "./fonts/rajdhani-500.woff2", weight: "500" },
    { path: "./fonts/rajdhani-600.woff2", weight: "600" },
    { path: "./fonts/rajdhani-700.woff2", weight: "700" },
  ],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Champ of Exodus",
  description: "Old School Runescape clan management site",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <div className="container">
          <header className="header card">
            <div className="brand">CHAMP OF EXODUS</div>
            <nav className="nav">
              <Link href="/">Home</Link>
              <Link href="/members">Members</Link>
              <Link href="/events">Events Calendar</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
