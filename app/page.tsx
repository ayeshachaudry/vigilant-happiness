"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import Avatar from "../components/Avatar";
import { motion, AnimatePresence } from "framer-motion";

type Faculty = {
  id: number;
  name: string;
  department: string;
  designation: string;
  image_url?: string | null;
};

export default function Home() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [activeDept, setActiveDept] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("faculty").select("*");
      if (data) setFaculty(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <p className="p-6">Loading...</p>;

  // 🔥 unique departments
  const departments = [
    "All",
    ...Array.from(new Set(faculty.map((f) => f.department))),
  ];

  const filtered =
    activeDept === "All"
      ? faculty
      : faculty.filter((f) => f.department === activeDept);

  return (
    <main className="relative min-h-screen overflow-hidden p-6">
      {/* background blobs */}
      <div className="blob bg-purple-500 w-96 h-96 top-10 left-10"></div>
      <div className="blob bg-pink-500 w-96 h-96 bottom-10 right-10"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          FAST Faculty Reviews
        </h1>

        {/* 🧷 DEPT TABS */}
        <div className="flex gap-3 flex-wrap mb-10">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setActiveDept(dept)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition
              ${activeDept === dept
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
            >
              {dept}
            </button>
          ))}
        </div>

        {/* 👨‍🏫 FACULTY GRID */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDept}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {filtered.map((f) => (
              <Link
                key={f.id}
                href={`/faculty/${f.id}`}
                className="p-6 rounded-2xl backdrop-blur bg-white/10
                border border-white/20 hover:scale-[1.03]
                transition shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <Avatar name={f.name} image={f.image_url} />
                  <div>
                    <h2 className="font-semibold text-lg">{f.name}</h2>
                    <p className="text-sm text-gray-300">
                      {f.designation}
                    </p>
                    <p className="text-xs text-gray-400">
                      {f.department}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-pink-400">
                  View reviews →
                </p>
              </Link>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
