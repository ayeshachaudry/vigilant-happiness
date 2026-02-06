"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import ReviewBox from "../../../components/ReviewBox";
import Avatar from "../../../components/Avatar";

export default function FacultyPage() {
    const { id } = useParams();
    const router = useRouter();
    const facultyId = Number(id);

    const [faculty, setFaculty] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [avgRating, setAvgRating] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            const { data: f } = await supabase
                .from("faculty")
                .select("*")
                .eq("id", facultyId)
                .single();

            const { data: r } = await supabase
                .from("reviews")
                .select("*")
                .eq("faculty_id", facultyId)
                .order("created_at", { ascending: false });

            setFaculty(f);
            setReviews(r || []);

            if (r && r.length > 0) {
                const avg = (r.reduce((sum, review) => sum + review.rating, 0) / r.length).toFixed(1);
                setAvgRating(parseFloat(avg));
            }
        };

        loadData();
    }, [facultyId]);

    if (!faculty) {
        return (
            <main className="relative min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-indigo-500 border-t-slate-500 rounded-full"
                />
            </main>
        );
    }

    return (
        <main className="relative min-h-screen p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="relative z-10 max-w-4xl mx-auto">
                {/* Back Button */}
                <motion.button
                    whileHover={{ x: -5 }}
                    onClick={() => router.back()}
                    className="mb-6 flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                >
                    ← Back
                </motion.button>

                {/* Faculty Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="p-6 md:p-10 rounded-xl bg-slate-800 border border-slate-700 shadow-lg mb-8"
                >
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                        <motion.div whileHover={{ scale: 1.1 }}>
                            <Avatar name={faculty.name} image={faculty.image_url} />
                        </motion.div>
                        <div className="text-center md:text-left flex-1">
                            <motion.h1
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-3xl md:text-5xl font-bold text-slate-100 mb-2"
                            >
                                {faculty.name}
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-lg md:text-xl text-purple-300 font-semibold mb-1"
                            >
                                {faculty.designation}
                            </motion.p>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-gray-400"
                            >
                                {faculty.department}
                            </motion.p>

                            {/* Rating Summary */}
                            {reviews.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-4 inline-block"
                                >
                                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/20">
                                        <span className="text-2xl text-yellow-400">★</span>
                                        <span className="text-xl font-bold text-white">{avgRating}</span>
                                        <span className="text-gray-400">({reviews.length} reviews)</span>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Review Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-10"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">Share Your Experience</h2>
                    <ReviewBox facultyId={facultyId} />
                </motion.div>

                {/* Reviews Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="text-2xl font-bold text-white mb-6">Reviews</h2>

                    {reviews.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-8 text-center rounded-2xl backdrop-blur bg-white/5 border border-white/20"
                        >
                            <p className="text-gray-400 text-lg">No reviews yet. Be the first to share!</p>
                        </motion.div>
                    ) : (
                        <AnimatePresence>
                            <motion.div className="space-y-4">
                                {reviews.map((r, i) => (
                                    <motion.div
                                        key={r.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: i * 0.05 }}
                                        whileHover={{ x: 4 }}
                                        className="p-5 rounded-2xl backdrop-blur bg-gradient-to-r from-white/5 to-white/10 border border-white/20 hover:border-white/40 shadow-lg transition-all hover:shadow-xl"
                                    >
                                        {/* Rating Stars */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex"
                                            >
                                                {[1, 2, 3, 4, 5].map((n) => (
                                                    <span
                                                        key={n}
                                                        className={`text-lg ${n <= r.rating
                                                            ? "text-yellow-400"
                                                            : "text-gray-500"
                                                            }`}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </motion.div>
                                            <span className="text-sm text-gray-400">
                                                {new Date(r.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {/* Comment */}
                                        {r.comment && (
                                            <motion.p
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.1 }}
                                                className="text-gray-300 leading-relaxed"
                                            >
                                                {r.comment}
                                            </motion.p>
                                        )}
                                    </motion.div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </motion.div>
            </div>
        </main>
    );
}
