"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { motion } from "framer-motion";

/* ================= TYPES ================= */


type Faculty = {
  id: number;
  name: string;
  designation: string | null;
  department: string | null; // "UNI / CAMPUS / DEPT"
  image_url: string | null;
};

type Review = {
  faculty_id: number;
  rating: number;
};

/* ================= HELPERS ================= */

const parseDept = (text: string | null) => {
  const parts = text?.split("/").map((p) => p.trim()) || [];
  return {
    university: parts[0] || "Unknown University",
    campus: parts[1] || "Unknown Campus",
    dept: parts[2] || "Unknown Department",
  };
};

/* ================= PAGE ================= */

export default function InstructorsPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [activeUni, setActiveUni] = useState<string | null>(null);
  const [activeCampus, setActiveCampus] = useState<string | null>(null);
  const [activeDept, setActiveDept] = useState<string | null>(null);

  /* ================= FETCH ================= */

  useEffect(() => {
    const fetchAll = async () => {
      const { data: facultyData } = await supabase
        .from("faculty")
        .select("id, name, designation, department, image_url")
        .order("name");

      const { data: reviewData } = await supabase
        .from("review")
        .select("faculty_id, rating");

      if (facultyData) {
        setFaculty(facultyData);
        const first = parseDept(facultyData[0]?.department);
        setActiveUni(first.university);
      }

      if (reviewData) setReviews(reviewData);

      setLoading(false);
    };

    fetchAll();
  }, []);

  /* ================= FILTER OPTIONS ================= */

  const universities = useMemo(() => {
    return Array.from(
      new Set(faculty.map((f) => parseDept(f.department).university))
    );
  }, [faculty]);

  const campuses = useMemo(() => {
    if (!activeUni) return [];
    return Array.from(
      new Set(
        faculty
          .filter(
            (f) => parseDept(f.department).university === activeUni
          )
          .map((f) => parseDept(f.department).campus)
      )
    );
  }, [faculty, activeUni]);

  const departments = useMemo(() => {
    if (!activeCampus) return [];
    return Array.from(
      new Set(
        faculty
          .filter((f) => {
            const h = parseDept(f.department);
            return (
              h.university === activeUni &&
              h.campus === activeCampus
            );
          })
          .map((f) => parseDept(f.department).dept)
      )
    );
  }, [faculty, activeUni, activeCampus]);

  /* ================= AUTO SELECT ================= */

  useEffect(() => {
    setActiveCampus(campuses[0] || null);
  }, [campuses]);

  useEffect(() => {
    setActiveDept(departments[0] || null);
  }, [departments]);

  /* ================= FILTERED FACULTY ================= */

  const filteredFaculty = useMemo(() => {
    return faculty.filter((f) => {
      const h = parseDept(f.department);

      const matchesHierarchy =
        h.university === activeUni &&
        h.campus === activeCampus &&
        h.dept === activeDept;

      const matchesSearch = f.name
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesHierarchy && matchesSearch;
    });
  }, [faculty, activeUni, activeCampus, activeDept, search]);

  /* ================= DEPT AVG RATING ================= */

  const deptRating = useMemo(() => {
    if (!activeDept) return null;

    const facultyIds = faculty
      .filter((f) => parseDept(f.department).dept === activeDept)
      .map((f) => f.id);

    const deptReviews = reviews.filter((r) =>
      facultyIds.includes(r.faculty_id)
    );

    if (deptReviews.length === 0) return null;

    const avg =
      deptReviews.reduce((a, b) => a + b.rating, 0) /
      deptReviews.length;

    return avg.toFixed(1);
  }, [faculty, reviews, activeDept]);

  if (loading) {
    return <div className="p-10 text-gray-400">Loading…</div>;
  }

  /* ================= UI ================= */

  return (
    <div className="relative min-h-screen bg-black text-white p-10 overflow-hidden">
      {/* 🌌 AURORA BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,180,0.25),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(0,200,255,0.25),transparent_60%)] blur-3xl" />

      <div className="relative z-10">
        <h1 className="text-4xl font-bold text-green-400 mb-6">
          Faculty Instructors
        </h1>

        {/* 🔍 SEARCH */}
        <input
          placeholder="Search instructor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md mb-6 p-3 rounded-xl bg-black/60 border border-green-400/40 outline-none"
        />

        {/* 🏛 UNI TABS */}
        <div className="flex gap-3 flex-wrap mb-4">
          {universities.map((uni) => (
            <button
              key={uni}
              onClick={() => {
                setActiveUni(uni);
                setActiveCampus(null);
                setActiveDept(null);
              }}
              className={`px-4 py-2 rounded-xl border ${
                activeUni === uni
                  ? "bg-green-400 text-black"
                  : "border-green-400/40 text-green-300"
              }`}
            >
              {uni}
            </button>
          ))}
        </div>

        {/* 🏫 CAMPUS */}
        <div className="flex gap-3 flex-wrap mb-4">
          {campuses.map((campus) => (
            <button
              key={campus}
              onClick={() => {
                setActiveCampus(campus);
                setActiveDept(null);
              }}
              className={`px-3 py-1 rounded-lg border ${
                activeCampus === campus
                  ? "bg-white text-black"
                  : "border-gray-500 text-gray-300"
              }`}
            >
              {campus}
            </button>
          ))}
        </div>

        {/* 🧑‍🏫 DEPT + RATING */}
        <div className="flex gap-3 flex-wrap mb-8 items-center">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setActiveDept(dept)}
              className={`px-3 py-1 text-sm rounded border ${
                activeDept === dept
                  ? "bg-gray-200 text-black"
                  : "border-gray-600 text-gray-300"
              }`}
            >
              {dept}
            </button>
          ))}

          {deptRating && (
            <div className="ml-4 text-green-400 font-semibold">
              ⭐ Dept Avg: {deptRating}
            </div>
          )}
        </div>

        {/* 👨‍🏫 FACULTY */}
        <div className="grid md:grid-cols-3 gap-6">
          {filteredFaculty.map((f) => (
            <Link key={f.id} href={`/faculty/${f.id}`}>
              <motion.div
                whileHover={{
                  scale: 1.06,
                  boxShadow: "0 0 45px rgba(0,255,150,0.7)",
                }}
                className="cursor-pointer rounded-xl border border-green-400/30 bg-black/60 p-5"
              >
                <img
                  src={f.image_url || "/avatar.png"}
                  className="w-20 h-20 rounded-full object-cover mb-3 border border-green-400"
                />

                <div className="text-lg font-semibold text-green-400">
                  {f.name}
                </div>

                <div className="text-sm text-gray-300">
                  {f.designation}
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {filteredFaculty.length === 0 && (
          <p className="text-gray-500 mt-10">
            No instructors found
          </p>
        )}
      </div>
    </div>
  );
}
