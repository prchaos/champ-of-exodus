import type { Metadata } from "next";
import Link from "next/link";
import { Cinzel, Rajdhani } from "next/font/google";
import "./globals.css";

const displayFont = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const bodyFont = Rajdhani({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
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
              <Link href="/events">Events</Link>
              <Link href="/login">Sign In</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
