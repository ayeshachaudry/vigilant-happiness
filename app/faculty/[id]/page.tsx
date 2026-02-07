"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

type Faculty = {
    id: number;
    name: string;
    department: string;
    designation: string;
    image_url: string | null;
};

type Review = {
    id: number;
    rating: number;
    comment: string;
    created_at: string;
};

export default function FacultyReviewPage() {
    const params = useParams();
    const facultyId = Number(params.id);

    const [faculty, setFaculty] = useState<Faculty | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);

    /* ---------------- FETCH FACULTY ---------------- */
    useEffect(() => {
        if (!facultyId) return;

        const fetchFaculty = async () => {
            const { data } = await supabase
                .from("faculty")
                .select("*")
                .eq("id", facultyId)
                .single();

            setFaculty(data);
        };

        fetchFaculty();
    }, [facultyId]);

    /* ---------------- FETCH REVIEWS ---------------- */
    const fetchReviews = async () => {
        const { data } = await supabase
            .from("review")
            .select("*")
            .eq("faculty_id", facultyId)
            .order("created_at", { ascending: false });

        setReviews(data || []);
    };

    useEffect(() => {
        fetchReviews();
    }, [facultyId]);

    /* ---------------- SUBMIT REVIEW ---------------- */
    const submitReview = async () => {
        if (rating === 0 || comment.trim() === "") {
            alert("Rating aur comment dono zaroori hain");
            return;
        }

        setLoading(true);

        await supabase.from("review").insert({
            faculty_id: facultyId,
            rating,
            comment,
        });

        setRating(0);
        setComment("");
        setLoading(false);
        fetchReviews(); // 🔥 instantly show new review
    };

    if (!faculty) {
        return <div className="p-10 text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white px-6 py-10">
            {/* ---------- FACULTY INFO ---------- */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-6 items-center mb-10"
            >
                <img
                    src={faculty.image_url || "/avatar.png"}
                    className="w-28 h-28 rounded-full border-2 border-green-400"
                />
                <div>
                    <h1 className="text-3xl font-bold neon-text">{faculty.name}</h1>
                    <p className="text-green-400">{faculty.designation}</p>
                    <p className="text-gray-400">{faculty.department}</p>
                </div>
            </motion.div>

            {/* ---------- SUBMIT REVIEW ---------- */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-zinc-900 p-6 rounded-xl border border-green-500 shadow-[0_0_25px_#22c55e]"
            >
                <h2 className="text-xl mb-4 text-green-400">
                    Submit review for <b>{faculty.name}</b>
                </h2>

                <div className="flex gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                        <button
                            key={n}
                            onClick={() => setRating(n)}
                            className={`text-2xl ${rating >= n ? "text-yellow-400" : "text-gray-600"
                                }`}
                        >
                            ★
                        </button>
                    ))}
                </div>

                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write honest review..."
                    className="w-full p-3 rounded bg-black border border-gray-700 mb-4"
                />

                <button
                    onClick={submitReview}
                    disabled={loading}
                    className="px-6 py-2 bg-green-500 text-black rounded hover:scale-105 transition"
                >
                    {loading ? "Submitting..." : "Submit Review"}
                </button>
            </motion.div>

            {/* ---------- PUBLIC REVIEWS ---------- */}
            <div className="mt-12">
                <h2 className="text-2xl mb-4 text-green-400">Public Reviews</h2>

                {reviews.length === 0 && (
                    <p className="text-gray-500">No reviews yet.</p>
                )}

                <div className="space-y-4">
                    {reviews.map((r) => (
                        <motion.div
                            key={r.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900 p-4 rounded-xl border border-green-700"
                        >
                            <div className="text-yellow-400 mb-1">
                                {"★".repeat(r.rating)}
                            </div>
                            <p className="text-gray-200">{r.comment}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {new Date(r.created_at).toLocaleString()}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
