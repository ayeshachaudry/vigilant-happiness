"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Faculty = {
    id: string;
    name: string;
    department: string | null;
    campus: string | null;
};

export default function InstructorsPage() {
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFaculty = async () => {
            try {
                setLoading(true);

                const { data, error } = await supabase
                    .from("faculty") // ✅ CORRECT TABLE
                    .select("*")
                    .order("name", { ascending: true });

                if (error) {
                    console.error("Supabase error:", error);
                    setError("Failed to load faculty");
                    setFaculty([]);
                    return;
                }

                setFaculty(data ?? []);
            } catch (err) {
                console.error("Unexpected error:", err);
                setError("Something went wrong");
                setFaculty([]);
            } finally {
                // 🔑 THIS WAS MISSING BEFORE
                setLoading(false);
            }
        };

        fetchFaculty();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen text-gray-400">
                Loading hierarchy...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen text-red-500">
                {error}
            </div>
        );
    }

    if (faculty.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen text-gray-400">
                No faculty found
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Faculty Instructors</h1>

            <div className="grid gap-4">
                {faculty.map((f) => (
                    <div
                        key={f.id}
                        className="border border-gray-700 rounded p-4"
                    >
                        <h2 className="text-xl font-semibold">{f.name}</h2>
                        <p className="text-sm text-gray-400">
                            {f.department ?? "No department"} •{" "}
                            {f.campus ?? "No campus"}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
