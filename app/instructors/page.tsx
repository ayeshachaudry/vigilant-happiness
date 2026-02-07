"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { motion } from "framer-motion";

type Faculty = {
    id: number;
    name: string;
    designation: string | null;
    department: string | null;
    image_url: string | null;
};

export default function InstructorsPage() {
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFaculty = async () => {
            const { data, error } = await supabase
                .from("faculty")
                .select("id, name, designation, department, image_url")
                .order("name");

            if (error) {
                console.error("Supabase error:", error.message);
            }

            if (data) setFaculty(data);
            setLoading(false);
        };

        fetchFaculty();
    }, []);

    if (loading) {
        return <div className="p-10 text-gray-400">Loading instructors...</div>;
    }

    return (
        <div className="min-h-screen bg-black p-10 text-white">
            <h1 className="text-4xl font-bold mb-8 text-green-400">
                Faculty Instructors
            </h1>

            <div className="grid md:grid-cols-3 gap-6">
                {faculty.map((f) => (
                    <Link key={f.id} href={`/faculty/${f.id}`}>
                        <motion.div
                            whileHover={{
                                scale: 1.05,
                                boxShadow: "0 0 40px rgba(0,255,150,0.6)",
                            }}
                            className="cursor-pointer rounded-xl border border-green-400/30 bg-black/60 backdrop-blur-xl p-5"
                        >
                            <img
                                src={f.image_url || "/avatar.png"}
                                alt={f.name}
                                className="w-24 h-24 rounded-full object-cover mb-4 border border-green-400"
                            />

                            <h2 className="text-xl font-semibold text-green-400">
                                {f.name}
                            </h2>

                            <p className="text-sm text-gray-300">
                                {f.designation || "Faculty Member"}
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                                {f.department}
                            </p>

                            <div className="mt-4 text-green-300 text-sm">
                                Click to review →
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>

            {faculty.length === 0 && (
                <p className="text-gray-500 mt-10">No instructors found</p>
            )}
        </div>
    );
}
