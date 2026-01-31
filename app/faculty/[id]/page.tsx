"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import ReviewBox from "../../../components/ReviewBox";

export default function FacultyPage() {
    const { id } = useParams();
    const facultyId = Number(id);

    const [faculty, setFaculty] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);

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
        };

        loadData();
    }, [facultyId]);

    if (!faculty) return <p>Loading...</p>;

    return (
        <main className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold">{faculty.name}</h1>
            <p className="text-gray-600">{faculty.designation}</p>
            <p className="mb-6">{faculty.department}</p>

            <h2 className="font-semibold mb-2">Write a review</h2>
            <ReviewBox facultyId={facultyId} />

            <h2 className="font-semibold mt-8 mb-2">Public Reviews</h2>

            {reviews.length === 0 && (
                <p className="text-sm text-gray-500">No reviews yet</p>
            )}

            {reviews.map((r) => (
                <div
                    key={r.id}
                    className="border rounded p-3 mb-3"
                >
                    <p className="text-yellow-500">
                        {"★".repeat(r.rating)}
                    </p>
                    {r.comment && (
                        <p className="text-sm mt-1">{r.comment}</p>
                    )}
                </div>
            ))}
        </main>
    );
}
