"use client";

import { useEffect } from "react";

export default function CelebrationOverlay({ onDone }: { onDone?: () => void }) {
    useEffect(() => {
        const t = setTimeout(() => onDone && onDone(), 3500);
        return () => clearTimeout(t);
    }, [onDone]);

    // Simple emoji confetti using absolute spans and CSS animation
    return (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center">
            <div className="w-full h-0 relative">
                {Array.from({ length: 30 }).map((_, i) => (
                    <span
                        key={i}
                        className="absolute text-2xl animate-confetti"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${-10 - Math.random() * 10}%`,
                            transform: `rotate(${Math.random() * 360}deg)`,
                            animationDelay: `${Math.random() * 1}s`,
                            color: ["#ff7a59", "#06b6d4", "#ffd166", "#7c3aed"][i % 4],
                        }}
                    >
                        {i % 5 === 0 ? "🎉" : i % 3 === 0 ? "👏" : "✨"}
                    </span>
                ))}
            </div>

            <style jsx>{`
        .animate-confetti {
          animation: confettiFall 3s cubic-bezier(.2,.8,.2,1) forwards;
        }

        @keyframes confettiFall {
          0% { opacity: 0; transform: translateY(-10vh) scale(0.8) rotate(0deg); }
          20% { opacity: 1; }
          100% { opacity: 1; transform: translateY(110vh) scale(1) rotate(420deg); }
        }
      `}</style>
        </div>
    );
}
