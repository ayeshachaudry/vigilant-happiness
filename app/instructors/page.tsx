"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

type Faculty = {
    id: string;
    name: string;
    department: string | null;
};

/* 🔧 PARSE "UNI / CAMPUS / DEPT" */
const parseHierarchy = (text: string | null) => {
    const parts = text?.split("/").map((p) => p.trim()) ?? [];
    return {
        university: parts[0] ?? "Unknown University",
        campus: parts[1] ?? "Unknown Campus",
        department: parts[2] ?? "Unknown Department",
    };
};

export default function InstructorsPage() {
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [activeUni, setActiveUni] = useState<string | null>(null);
    const [activeCampus, setActiveCampus] = useState<string | null>(null);
    const [activeDept, setActiveDept] = useState<string | null>(null);

    /* 📡 FETCH DATA */
    useEffect(() => {
        const fetchFaculty = async () => {
            const { data } = await supabase
                .from("faculty")
                .select("id, name, department")
                .order("name");

            if (data && data.length > 0) {
                setFaculty(data);
                setActiveUni(parseHierarchy(data[0].department).university);
            }
            setLoading(false);
        };

        fetchFaculty();
    }, []);

    /* 🔍 SEARCH */
    const searched = useMemo(() => {
        return faculty.filter((f) =>
            f.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [faculty, search]);

    /* 🏛 UNIVERSITIES */
    const universities = useMemo(() => {
        return Array.from(
            new Set(searched.map((f) => parseHierarchy(f.department).university))
        );
    }, [searched]);

    /* 🏫 CAMPUSES */
    const campuses = useMemo(() => {
        if (!activeUni) return [];
        return Array.from(
            new Set(
                searched
                    .filter(
                        (f) => parseHierarchy(f.department).university === activeUni
                    )
                    .map((f) => parseHierarchy(f.department).campus)
            )
        );
    }, [searched, activeUni]);

    /* 🧑‍🏫 DEPARTMENTS */
    const departments = useMemo(() => {
        if (!activeCampus) return [];
        return Array.from(
            new Set(
                searched
                    .filter((f) => {
                        const h = parseHierarchy(f.department);
                        return h.university === activeUni && h.campus === activeCampus;
                    })
                    .map((f) => parseHierarchy(f.department).department)
            )
        );
    }, [searched, activeUni, activeCampus]);

    /* 👨‍🏫 FINAL LIST */
    const facultyList = useMemo(() => {
        return searched.filter((f) => {
            const h = parseHierarchy(f.department);
            return (
                h.university === activeUni &&
                h.campus === activeCampus &&
                (activeDept ? h.department === activeDept : true)
            );
        });
    }, [searched, activeUni, activeCampus, activeDept]);

    /* AUTO SELECT */
    useEffect(() => {
        setActiveCampus(campuses[0] ?? null);
    }, [campuses]);

    useEffect(() => {
        setActiveDept(departments[0] ?? null);
    }, [departments]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-green-400">
                Loading faculty matrix…
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-black text-white overflow-hidden">
            {/* 🌌 AURORA BACKGROUND */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,255,150,0.15),transparent_60%),radial-gradient(circle_at_70%_70%,rgba(0,255,255,0.12),transparent_60%)] blur-3xl" />

            <div className="relative z-10 max-w-7xl mx-auto p-8 space-y-10">
                {/* TITLE */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-extrabold tracking-wide text-green-400 drop-shadow-[0_0_25px_rgba(0,255,150,0.6)]"
                >
                    Faculty Reviews
                </motion.h1>

                {/* SEARCH */}
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search instructors..."
                    className="w-full p-4 rounded-xl bg-black/60 border border-green-400/40 backdrop-blur text-green-200 placeholder-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-[0_0_20px_rgba(0,255,150,0.15)]"
                />

                {/* UNIVERSITY TABS */}
                <div className="flex flex-wrap gap-3">
                    {universities.map((uni) => (
                        <motion.button
                            key={uni}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setActiveUni(uni);
                                setActiveCampus(null);
                                setActiveDept(null);
                            }}
                            className={`px-5 py-2 rounded-full font-medium transition
                ${uni === activeUni
                                    ? "bg-green-400 text-black shadow-[0_0_25px_rgba(0,255,150,0.8)]"
                                    : "border border-green-400/40 text-green-300 hover:bg-green-400/10"
                                }`}
                        >
                            {uni}
                        </motion.button>
                    ))}
                </div>

                {/* CAMPUS TABS */}
                <div className="flex flex-wrap gap-2">
                    {campuses.map((campus) => (
                        <motion.button
                            key={campus}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => {
                                setActiveCampus(campus);
                                setActiveDept(null);
                            }}
                            className={`px-4 py-1 rounded-lg text-sm
                ${campus === activeCampus
                                    ? "bg-cyan-300 text-black shadow-[0_0_20px_rgba(0,255,255,0.7)]"
                                    : "border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/10"
                                }`}
                        >
                            {campus}
                        </motion.button>
                    ))}
                </div>

                {/* DEPT TABS */}
                <div className="flex flex-wrap gap-2">
                    {departments.map((dept) => (
                        <motion.button
                            key={dept}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => setActiveDept(dept)}
                            className={`px-3 py-1 text-xs rounded-md
                ${dept === activeDept
                                    ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                                    : "border border-gray-600 text-gray-300 hover:bg-white/10"
                                }`}
                        >
                            {dept}
                        </motion.button>
                    ))}
                </div>

                {/* FACULTY GRID */}
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {facultyList.map((f) => (
                        <motion.div
                            key={f.id}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="group relative rounded-2xl p-6 bg-black/60 backdrop-blur border border-green-400/30 hover:border-green-400 shadow-[0_0_30px_rgba(0,255,150,0.15)] hover:shadow-[0_0_45px_rgba(0,255,150,0.45)] transition"
                        >
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 bg-gradient-to-br from-green-400/10 to-cyan-400/10 transition" />

                            <div className="relative z-10">
                                <h3 className="text-lg font-semibold text-green-300">
                                    {f.name}
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    {parseHierarchy(f.department).department}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {facultyList.length === 0 && (
                    <p className="text-center text-gray-400">
                        No faculty detected in this sector.
                    </p>
                )}
            </div>
        </div>
    );
}
