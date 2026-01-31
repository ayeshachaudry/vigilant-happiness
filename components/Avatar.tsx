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
            <motion.img
                src={image}
                alt={name}
                className="w-20 h-20 rounded-full object-cover"
                whileHover={{ scale: 1.1 }}
            />
        );
    }

    return (
        <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-20 h-20 rounded-full flex items-center justify-center
      bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-xl"
        >
            {initials}
        </motion.div>
    );
}
