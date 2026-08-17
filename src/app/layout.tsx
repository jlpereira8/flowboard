import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://flowboard-eight-indol.vercel.app"),
  title: "FlowBoard — Project management for engineering teams",
  description: "Move projects, tasks, and teams forward in one focused workspace.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "FlowBoard",
    title: "FlowBoard — SaaS Project Workspace",
    description: "Manage projects, tasks, teams, and Kanban workflows in one focused workspace.",
    images: [
      {
        url: "/og-flowboard.jpg",
        width: 1200,
        height: 630,
        alt: "FlowBoard project management workspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowBoard — SaaS Project Workspace",
    description: "Manage projects, tasks, teams, and Kanban workflows in one focused workspace.",
    images: ["/og-flowboard.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
