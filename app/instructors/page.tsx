"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

type Faculty = {
    id: string;
    name: string;
    department: string | null; // "FAST-NUCES / Campus / Dept"
};

/* 🔧 PARSER */
const parseHierarchy = (text: string | null) => {
    if (!text) {
        return {
            university: "Unknown University",
            campus: "Unknown Campus",
            department: "Unknown Department",
        };
    }

    const parts = text.split("/").map((p) => p.trim());

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

    /* 📡 FETCH */
    useEffect(() => {
        const fetchFaculty = async () => {
            const { data } = await supabase
                .from("faculty")
                .select("id, name, department")
                .order("name");

            if (data && data.length > 0) {
                setFaculty(data);
                const first = parseHierarchy(data[0].department);
                setActiveUni(first.university);
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
        return <div className="p-10 text-green-400">Loading faculty...</div>;
    }

    return (
        <div className="relative min-h-screen p-10 space-y-10 text-white overflow-hidden">

            {/* 🌌 AURORA BACKGROUND */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black via-[#031b14] to-black">
                <div className="absolute w-[600px] h-[600px] bg-green-400/20 blur-[120px] top-[-200px] left-[-200px] animate-pulse" />
                <div className="absolute w-[500px] h-[500px] bg-emerald-400/20 blur-[140px] bottom-[-200px] right-[-200px] animate-pulse" />
            </div>

            {/* TITLE */}
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold tracking-wide"
            >
                Faculty Instructors
            </motion.h1>

            {/* SEARCH */}
            <motion.input
                whileFocus={{ scale: 1.02 }}
                className="w-full p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 focus:outline-none focus:border-green-400 transition"
                placeholder="Search faculty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {/* UNIVERSITY TABS */}
            <div className="flex gap-3 flex-wrap">
                {universities.map((uni) => (
                    <motion.button
                        key={uni}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            setActiveUni(uni);
                            setActiveCampus(null);
                            setActiveDept(null);
                        }}
                        className={`px-6 py-2 rounded-full backdrop-blur-md border transition ${uni === activeUni
                                ? "bg-green-400/20 border-green-400 text-green-300 shadow-[0_0_25px_rgba(0,255,170,0.4)]"
                                : "border-white/20 text-white/70 hover:border-green-400"
                            }`}
                    >
                        {uni}
                    </motion.button>
                ))}
            </div>

            {/* CAMPUS TABS */}
            <div className="flex gap-2 flex-wrap">
                {campuses.map((campus) => (
                    <motion.button
                        key={campus}
                        whileHover={{ y: -2 }}
                        onClick={() => {
                            setActiveCampus(campus);
                            setActiveDept(null);
                        }}
                        className={`px-4 py-1 rounded-lg text-sm transition ${campus === activeCampus
                                ? "bg-green-400 text-black"
                                : "bg-white/5 hover:bg-green-400/20"
                            }`}
                    >
                        {campus}
                    </motion.button>
                ))}
            </div>

            {/* DEPARTMENT TABS */}
            <div className="flex gap-2 flex-wrap">
                {departments.map((dept) => (
                    <motion.button
                        key={dept}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setActiveDept(dept)}
                        className={`px-3 py-1 rounded-md text-xs transition ${dept === activeDept
                                ? "bg-white text-black"
                                : "bg-white/5 hover:bg-green-400/20"
                            }`}
                    >
                        {dept}
                    </motion.button>
                ))}
            </div>

            {/* FACULTY CARDS */}
            <div className="grid md:grid-cols-3 gap-6 pt-6">
                {facultyList.map((f) => (
                    <motion.div
                        key={f.id}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="rounded-2xl p-6 bg-white/5 backdrop-blur-lg border border-white/10 hover:border-green-400 transition shadow-lg"
                    >
                        <div className="text-lg font-semibold">{f.name}</div>
                        <div className="text-sm text-green-300 mt-1">
                            {parseHierarchy(f.department).department}
                        </div>
                    </motion.div>
                ))}
            </div>

            {facultyList.length === 0 && (
                <p className="text-white/60">No faculty found</p>
            )}
        </div>
    );
}
