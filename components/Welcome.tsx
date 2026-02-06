"use client";

import React, { useEffect, useState } from "react";

export default function Welcome() {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setVisible(false), 4200);
        return () => clearTimeout(t);
    }, []);

    if (!visible) return null;

    return (
        <div className="welcome-overlay" role="dialog" aria-modal="true">
            <div className="aurora">
                <div className="aurora-layer layer-1" />
                <div className="aurora-layer layer-2" />
                <div className="aurora-layer layer-3" />
            </div>

            <div className="welcome-card futuristic-card fade-in-up">
                <div className="text-4xl welcome-title logo-neon">Faculty Reviews</div>
                <div className="mt-2 text-sm welcome-subtitle">Explore the future of academic feedback</div>
                <button
                    onClick={() => setVisible(false)}
                    className="enter-btn neon-btn mt-6"
                    aria-label="Enter site"
                >
                    Enter
                </button>
            </div>
        </div>
    );
}
