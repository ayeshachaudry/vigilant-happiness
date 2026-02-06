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
    title: "University Faculty Reviews",
    description: "Discover and review professors across Pakistan's top universities - FAST, Bahria, Air, NUST",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="scroll-smooth">
            <body className="min-h-screen text-white overflow-x-hidden antialiased">
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
                    <div
                        style={{ background: 'rgba(124,58,237,0.28)' }}
                        className="absolute -left-28 -top-20 w-72 h-72 blob"
                    />
                    <div
                        style={{ background: 'rgba(14,165,233,0.18)' }}
                        className="absolute -right-32 bottom-[-10%] w-96 h-96 blob rotate-effect"
                    />
                </div>
                <main className="relative z-10 min-h-screen px-4 md:px-8 lg:px-16">{children}</main>
            </body>
        </html>
    );
}
