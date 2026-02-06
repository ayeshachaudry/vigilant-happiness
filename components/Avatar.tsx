"use client";
import { motion } from "framer-motion";

export default function Avatar({
    name,
    image,
}: {
    name: string;
    image?: string | null;
}) {
    const initials = name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase();

    if (image) {
        return (
            <motion.div
                whileHover={{ scale: 1.15 }}
                className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900"
            >
                <motion.img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent"></div>
            </motion.div>
        );
    }

    return (
        <motion.div
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg flex items-center justify-center
            bg-gradient-to-br from-indigo-600 to-indigo-400 text-white font-bold text-lg md:text-2xl
            shadow-lg ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900
            overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
            <span className="relative z-10">{initials}</span>
        </motion.div>
    );
}
