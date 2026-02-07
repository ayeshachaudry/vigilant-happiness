"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

type Faculty = {
    id: number;
    name: string;
    designation: string | null;
    department: string | null;
    image_url: string | null;
};

export default function FacultyReviewPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    /* ✅ CORRECT WAY (Next.js 14+) */
    const { id } = use(params);
    const facultyId = Number(id);

    const [faculty, setFaculty] = useState<Faculty | null>(null);
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    /* 📡 FETCH FACULTY */
    useEffect(() => {
        const fetchFaculty = async () => {
            const { data, error } = await supabase
                .from("faculty")
                .select("id, name, designation, department, image_url")
                .eq("id", facultyId)
                .single();

            if (error) {
                console.error(error);
                return;
            }

            setFaculty(data);
        };

        fetchFaculty();
    }, [facultyId]);

    /* 📝 SUBMIT REVIEW */
    const submitReview = async () => {
        if (!rating || !review) return;

        setLoading(true);

        await supabase.from("review").insert({
            faculty_id: facultyId,
            rating,
            review,
        });

        setLoading(false);
        setSuccess(true);
        setRating(0);
        setReview("");

        setTimeout(() => setSuccess(false), 2500);
    };

    if (!faculty) {
        return <div className="p-10 text-gray-400">Loading instructor...</div>;
    }

    return (
        <div className="relative min-h-screen bg-black text-white flex items-center justify-center overflow-hidden p-6">
            {/* 🌌 AURORA BACKGROUND */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,255,170,0.25),transparent_60%),radial-gradient(circle_at_85%_80%,rgba(0,200,255,0.2),transparent_60%)] blur-3xl" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-xl rounded-2xl border border-green-400/30 bg-black/70 backdrop-blur-xl p-8 shadow-[0_0_70px_rgba(0,255,150,0.25)]"
            >
                {/* 👤 INSTRUCTOR INFO */}
                <div className="flex items-center gap-4 mb-6">
                    <motion.img
                        src={faculty.image_url || "/avatar.png"}
                        alt={faculty.name}
                        whileHover={{ scale: 1.05 }}
                        className="w-20 h-20 rounded-full object-cover border border-green-400 shadow-[0_0_25px_rgba(0,255,150,0.6)]"
                    />

                    <div>
                        <h2 className="text-2xl font-bold text-green-400">
                            {faculty.name}
                        </h2>
                        <p className="text-sm text-gray-300">
                            {faculty.designation || "Faculty Member"}
                        </p>
                        <p className="text-xs text-gray-400">
                            {faculty.department}
                        </p>
                    </div>
                </div>

                {/* ⭐ RATING */}
                <div className="flex justify-center gap-3 mb-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <motion.button
                            key={i}
                            whileHover={{ scale: 1.3 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setRating(i)}
                            className={`text-3xl ${rating >= i ? "text-green-400" : "text-gray-600"
                                } drop-shadow-[0_0_12px_rgba(0,255,150,0.8)]`}
                        >
                            ★
                        </motion.button>
                    ))}
                </div>

                {/* ✍️ REVIEW */}
                <motion.textarea
                    whileFocus={{
                        boxShadow: "0 0 30px rgba(0,255,150,0.5)",
                    }}
                    className="w-full h-32 bg-black/60 border border-green-400/40 rounded-xl p-4 text-gray-200 outline-none resize-none mb-6"
                    placeholder={`Write a review for ${faculty.name}...`}
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                />

                {/* 🚀 SUBMIT */}
                <motion.button
                    whileHover={{
                        scale: 1.05,
                        boxShadow: "0 0 40px rgba(0,255,150,0.8)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    disabled={loading}
                    onClick={submitReview}
                    className="w-full py-3 rounded-xl bg-green-500 text-black font-semibold tracking-wide"
                >
                    {loading ? "Submitting..." : "Submit Review"}
                </motion.button>

                {/* ✅ SUCCESS */}
                <AnimatePresence>
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-2xl"
                        >
                            <div className="text-green-400 text-xl font-bold drop-shadow-[0_0_30px_rgba(0,255,150,1)]">
                                ✔ Review submitted for {faculty.name}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
