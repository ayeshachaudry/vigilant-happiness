"use client";
import { motion } from "framer-motion";

export default function MagneticCard({
    children,
}: {
    children: React.ReactNode;
}) {
    const playClick = () => {
        const audio = new Audio("/click.mp3");
        audio.volume = 0.2;
        audio.play();
    };

    return (
        <motion.div
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.97 }}
            onTap={playClick}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="futuristic-card rounded-2xl p-2"
        >
            {children}
        </motion.div>
    );
}
