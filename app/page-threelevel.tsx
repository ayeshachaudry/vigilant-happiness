"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import Avatar from "../components/Avatar";
import { motion } from "framer-motion";

type Faculty = {
    id: number;
    name: string;
    department: string;
    designation: string;
    image_url?: string | null;
};

type ParsedDept = {
    university: string;
    campus: string;
    department: string;
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.2,
        },
    },
};

const filterButtonVariants = {
    initial: { opacity: 0, scale: 0.8, y: 20 },
    animate: (i: number) => ({
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { delay: i * 0.05, duration: 0.4 },
    }),
    hover: { scale: 1.08, y: -2 },
};

// Parse department field: "UNIVERSITY / CAMPUS / DEPARTMENT"
function parseDepartment(deptStr: string): ParsedDept {
    const parts = deptStr.split('/').map(p => p.trim());
    return {
        university: parts[0] || "Unknown",
        campus: parts[1] || "Unknown",
        department: parts[2] || "Unknown",
    };
}

export default function Home() {
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [selectedUni, setSelectedUni] = useState<string | null>(null);
    const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                console.log("Starting faculty data load...");
                const { data, error } = await supabase.from("faculty").select("*");
                if (error) {
                    console.error("Supabase error:", error.message);
                }
                if (data) {
                    console.log("Faculty count:", data.length);
                    setFaculty(data);
                } else {
                    setFaculty([]);
                }
            } catch (err) {
                console.error("Load error:", err);
                setFaculty([]);
            }
            setLoading(false);
        };
        load();
    }, []);

    // Parse all faculty departments
    const parsedFaculty = faculty.map(f => ({
        ...f,
        parsed: parseDepartment(f.department),
    }));

    // Get unique universities, campuses, departments
    const universities = Array.from(new Set(parsedFaculty.map(f => f.parsed.university))).sort();

    const campuses = selectedUni
        ? Array.from(new Set(parsedFaculty.filter(f => f.parsed.university === selectedUni).map(f => f.parsed.campus))).sort()
        : [];

    const departments = selectedCampus && selectedUni
        ? Array.from(new Set(parsedFaculty.filter(f => f.parsed.university === selectedUni && f.parsed.campus === selectedCampus).map(f => f.parsed.department))).sort()
        : [];

    // Department priority: Computing, EE first, then alphabetical
    const deptPriority = [/computer/i, /computing/i, /software/i, /electrical/i, /ee/i];
    const sortedDepts = departments.sort((a, b) => {
        const ai = deptPriority.findIndex(rx => rx.test(a));
        const bi = deptPriority.findIndex(rx => rx.test(b));
        if (ai !== -1 || bi !== -1) {
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
        }
        return a.localeCompare(b);
    });

    // Filter faculty based on selections
    let filtered = parsedFaculty;

    if (selectedUni) {
        filtered = filtered.filter(f => f.parsed.university === selectedUni);
    }
    if (selectedCampus) {
        filtered = filtered.filter(f => f.parsed.campus === selectedCampus);
    }
    if (selectedDept) {
        filtered = filtered.filter(f => f.parsed.department === selectedDept);
    }

    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(f =>
            f.name.toLowerCase().includes(q) ||
            f.designation.toLowerCase().includes(q) ||
            f.parsed.department.toLowerCase().includes(q)
        );
    }

    // Reset dependent filters when parent changes
    const handleUniSelect = (uni: string | null) => {
        setSelectedUni(uni);
        setSelectedCampus(null);
        setSelectedDept(null);
    };

    const handleCampusSelect = (campus: string | null) => {
        setSelectedCampus(campus);
        setSelectedDept(null);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-slate-50 overflow-x-hidden relative">
            {/* Animated background */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950"></div>
                <motion.div
                    animate={{
                        background: [
                            "radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.2) 0%, transparent 50%)",
                            "radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)",
                            "radial-gradient(circle at 40% 20%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)",
                        ],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                ></motion.div>
                <motion.div
                    animate={{ x: [0, 150, -100, 0], y: [0, 80, -60, 0], scale: [1, 1.2, 0.9, 1] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/25 rounded-full blur-3xl"
                ></motion.div>
                <motion.div
                    animate={{ x: [0, -150, 100, 0], y: [0, -80, 60, 0], scale: [1, 0.8, 1.1, 1] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/25 rounded-full blur-3xl"
                ></motion.div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 relative z-10">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: -60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="mb-28 text-center py-20"
                >
                    <motion.span
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="inline-block px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-400/40 text-indigo-300 text-sm font-bold mb-8 backdrop-blur-md shadow-lg"
                    >
                        ✨ Next Generation Review Platform
                    </motion.span>

                    <motion.div
                        animate={{ y: [0, -20, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="mb-10"
                    >
                        <h1 className="text-8xl md:text-9xl xl:text-10xl font-black mb-8 bg-gradient-to-r from-indigo-300 via-purple-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-2xl leading-tight">
                            Professor Insights
                        </h1>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="space-y-5"
                    >
                        <p className="text-3xl md:text-4xl text-slate-200 font-bold">
                            Discover & Review Your Instructors
                        </p>
                        <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
                            Make informed academic decisions with authentic, peer-verified reviews.
                        </p>
                    </motion.div>
                </motion.div>

                {/* University Tabs */}
                <motion.div initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.9 }} className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <motion.span animate={{ rotate: [0, 360], scale: [1, 1.3, 1] }} transition={{ duration: 20, repeat: Infinity }} className="text-3xl">🏫</motion.span>
                        <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">University</p>
                    </div>
                    <div className="flex gap-2 flex-wrap bg-slate-900/30 p-2 rounded-2xl border border-slate-700/40 backdrop-blur-sm">
                        {universities.length === 0 ? (
                            <p className="text-slate-400 px-4 py-3">No universities available</p>
                        ) : (
                            universities.map((uni, i) => (
                                <motion.button
                                    key={uni}
                                    custom={i}
                                    variants={filterButtonVariants}
                                    initial="initial"
                                    animate="animate"
                                    whileHover="hover"
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => handleUniSelect(selectedUni === uni ? null : uni)}
                                    className={`px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300 ${selectedUni === uni
                                        ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/60 border border-transparent"
                                        : "bg-slate-800/40 text-slate-300 border border-slate-700/60 hover:bg-slate-800/60 hover:border-indigo-500/50"
                                        }`}
                                >
                                    {uni}
                                </motion.button>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Campus Tabs */}
                {selectedUni && (
                    <motion.div initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35, duration: 0.9 }} className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <motion.span animate={{ rotate: [0, -360], scale: [1, 1.3, 1] }} transition={{ duration: 20, repeat: Infinity }} className="text-3xl">🏢</motion.span>
                            <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">Campus</p>
                        </div>
                        <div className="flex gap-2 flex-wrap bg-slate-900/30 p-2 rounded-2xl border border-slate-700/40 backdrop-blur-sm">
                            {campuses.length === 0 ? (
                                <p className="text-slate-400 px-4 py-3">No campuses available</p>
                            ) : (
                                campuses.map((campus, i) => (
                                    <motion.button
                                        key={campus}
                                        custom={i}
                                        variants={filterButtonVariants}
                                        initial="initial"
                                        animate="animate"
                                        whileHover="hover"
                                        whileTap={{ scale: 0.92 }}
                                        onClick={() => handleCampusSelect(selectedCampus === campus ? null : campus)}
                                        className={`px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300 ${selectedCampus === campus
                                            ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/60 border border-transparent"
                                            : "bg-slate-800/40 text-slate-300 border border-slate-700/60 hover:bg-slate-800/60 hover:border-indigo-500/50"
                                            }`}
                                    >
                                        {campus}
                                    </motion.button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Department Tabs */}
                {selectedCampus && (
                    <motion.div initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.9 }} className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <motion.span animate={{ rotate: [0, 360], scale: [1, 1.3, 1] }} transition={{ duration: 20, repeat: Infinity }} className="text-3xl">📚</motion.span>
                            <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">Department</p>
                        </div>
                        <div className="flex gap-2 flex-wrap bg-slate-900/30 p-2 rounded-2xl border border-slate-700/40 backdrop-blur-sm">
                            {sortedDepts.length === 0 ? (
                                <p className="text-slate-400 px-4 py-3">No departments available</p>
                            ) : (
                                sortedDepts.map((dept, i) => (
                                    <motion.button
                                        key={dept}
                                        custom={i}
                                        variants={filterButtonVariants}
                                        initial="initial"
                                        animate="animate"
                                        whileHover="hover"
                                        whileTap={{ scale: 0.92 }}
                                        onClick={() => setSelectedDept(selectedDept === dept ? null : dept)}
                                        className={`px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300 ${selectedDept === dept
                                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50 border border-transparent"
                                            : "bg-slate-800/40 text-slate-300 border border-slate-700/60 hover:bg-slate-800/60 hover:border-purple-500/40"
                                            }`}
                                    >
                                        {dept}
                                    </motion.button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.9 }}
                    className="mb-18 group"
                >
                    <div className="relative">
                        <motion.div
                            animate={{
                                boxShadow: [
                                    "0 0 40px rgba(99, 102, 241, 0.4), 0 0 80px rgba(139, 92, 246, 0.2)",
                                    "0 0 80px rgba(139, 92, 246, 0.6), 0 0 140px rgba(99, 102, 241, 0.4)",
                                    "0 0 40px rgba(99, 102, 241, 0.4), 0 0 80px rgba(139, 92, 246, 0.2)",
                                ],
                            }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition duration-500"
                        ></motion.div>
                        <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-2xl rounded-2xl border border-slate-700/70 group-hover:border-indigo-500/60 transition-all duration-300 shadow-2xl">
                            <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-400 group-focus-within:text-indigo-300 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="🔍 Search by name, title, or department..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-16 pr-6 py-5 bg-transparent text-white placeholder-slate-500 focus:outline-none text-lg font-medium focus:placeholder-slate-400 transition"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Faculty Grid */}
                {loading ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-40">
                        <div className="text-center">
                            <motion.div className="relative w-24 h-24 mx-auto mb-10">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-4 border-transparent border-t-indigo-500 border-r-purple-500 border-b-pink-500 rounded-full shadow-lg shadow-purple-500/30"
                                ></motion.div>
                            </motion.div>
                            <motion.p
                                animate={{ opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                className="text-slate-300 text-xl font-semibold"
                            >
                                Loading faculty data...
                            </motion.p>
                        </div>
                    </motion.div>
                ) : filtered.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {filtered.map((f) => (
                            <Link key={f.id} href={`/faculty/${f.id}`}>
                                <div className="group relative h-full rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 border-2 border-indigo-500/80 p-6 hover:border-indigo-400 hover:shadow-2xl transition-all hover:shadow-indigo-500/50">
                                    <div className="flex items-start gap-4 mb-4">
                                        <Avatar name={f.name} image={f.image_url} />
                                        <div className="flex-1 min-w-0">
                                            <h2 className="font-bold text-lg text-indigo-100 group-hover:text-white transition-colors line-clamp-2">{f.name}</h2>
                                            <p className="text-sm text-indigo-300 font-semibold mt-1 line-clamp-1">{f.designation}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-indigo-500/20 group-hover:border-indigo-400/50 transition-colors">
                                        <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm group-hover:text-indigo-200">
                                            <span>View Reviews</span>
                                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center py-40"
                    >
                        <motion.div
                            animate={{ y: [0, -20, 0], scale: [1, 1.15, 1] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="mb-8 text-8xl"
                        >
                            🔍
                        </motion.div>
                        <p className="text-slate-300 text-3xl font-bold mb-4">No faculty found</p>
                        <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
                            Try selecting different options or searching to discover instructors
                        </p>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
