import type { Metadata } from "next";
import { Orbitron } from "next/font/google";
import "./globals.css";
import "./aurora.css";
import Welcome from "../components/Welcome";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Faculty Reviews",
  description: "Find and review professors — modern, clean interface",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className={`min-h-screen bg-[var(--background)] text-[var(--foreground)] ${orbitron.variable} font-sans`}>
        <Welcome />
        <div className="site-root relative z-10">
          <header className="w-full backdrop-blur-md bg-transparent border-b border-white/6 relative">
            <div className="absolute inset-0 pointer-events-none">
              <div className="blob" style={{ width: 420, height: 420, left: -100, top: -120, background: 'linear-gradient(90deg, rgba(0,255,240,0.12), rgba(138,79,255,0.14))' }} />
              <div className="blob" style={{ width: 320, height: 320, right: -80, bottom: -60, background: 'linear-gradient(90deg, rgba(138,79,255,0.08), rgba(0,255,240,0.08))' }} />
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 flex items-center justify-between h-16 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-black font-bold logo-neon">FR</div>
                <div className="text-lg font-semibold neon-text">Faculty Reviews</div>
              </div>

              <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
                <a href="/" className="hover:text-[var(--neon)]">Home</a>
                <a href="/instructors" className="hover:text-[var(--neon)]">Instructors</a>
                <a href="#" className="hover:text-[var(--neon)]">About</a>
              </nav>

              <div className="hidden md:block">
                <input placeholder="Search faculty..." className="px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.02)] border border-white/6 text-sm text-[var(--foreground)] focus:outline-none backdrop-blur-sm" />
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-8">
            {children}
          </main>

          <footer className="w-full mt-12 border-t border-white/6 py-6 text-center text-sm text-slate-400">
            © {new Date().getFullYear()} Faculty Reviews
          </footer>
        </div>
      </body>
    </html>
  );
}
