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
    university?: string;
};

export default function Home() {
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [activeUni, setActiveUni] = useState("All");
    const [activeDept, setActiveDept] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    const universities = ["All", "FAST", "Bahria", "Air", "NUST"];

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await supabase.from("faculty").select("*");
                if (data) setFaculty(data);
            } catch (err) {
                console.error("Load error:", err);
            }
            setLoading(false);
        };
        load();
    }, []);

    let byUni = activeUni === "All" ? faculty : faculty.filter((f) => f.university === activeUni);
    let filtered = activeDept === "All" ? byUni : byUni.filter((f) => f.department === activeDept);

    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter((f) =>
            f.name.toLowerCase().includes(q) ||
            f.designation.toLowerCase().includes(q) ||
            f.department.toLowerCase().includes(q)
        );
    }

    const departments = ["All", ...Array.from(new Set(byUni.map((f) => f.department)))];

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl md:text-6xl font-bold mb-3 text-slate-100">Professor Insights</h1>
                    <p className="text-lg text-slate-400">Rate & review instructors</p>
                </div>

                {/* University Filter */}
                <div className="mb-8 pb-6 border-b border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 mb-4 uppercase">Institution:</p>
                    <div className="flex gap-2 flex-wrap">
                        {universities.map((uni) => (
                            <button
                                key={uni}
                                onClick={() => {
                                    setActiveUni(uni);
                                    setActiveDept("All");
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeUni === uni
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                                    }`}
                            >
                                {uni}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search */}
                <div className="mb-8">
                    <input
                        type="text"
                        placeholder="Search name, title, dept..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-indigo-500 text-white placeholder-slate-500 focus:outline-none"
                    />
                </div>

                {/* Department Filter */}
                <div className="mb-10 pb-6 border-b border-slate-700 flex gap-2 flex-wrap">
                    {departments.map((dept) => (
                        <button
                            key={dept}
                            onClick={() => setActiveDept(dept)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeDept === dept
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                                }`}
                        >
                            {dept}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-12 h-12 border-3 border-indigo-500 border-t-slate-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-400">Loading...</p>
                        </div>
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((f) => (
                            <Link key={f.id} href={`/faculty/${f.id}`}>
                                <div className="p-6 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer h-full hover:shadow-lg">
                                    <div className="flex items-center gap-4 mb-4">
                                        <Avatar name={f.name} image={f.image_url} />
                                        <div className="flex-1">
                                            <h2 className="font-bold text-lg text-slate-100">{f.name}</h2>
                                            <p className="text-sm text-slate-400">{f.designation}</p>
                                            <p className="text-xs text-slate-500">{f.department}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-indigo-400">See reviews →</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-slate-400 text-lg">No faculty found</p>
                    </div>
                )}
            </div>
        </main>
    );
}
