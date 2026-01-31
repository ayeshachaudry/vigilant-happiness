"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ReviewBox({
  facultyId,
}: {
  facultyId: number;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submitReview = async () => {
    if (rating === 0) {
      alert("Please select rating");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("reviews").insert({
      faculty_id: facultyId,
      rating,
      comment,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      setDone(true);
      setComment("");
      setRating(0);
    }
  };

  if (done) {
    return (
      <p className="text-green-600 text-sm mt-2">
        ✅ Review submitted anonymously
      </p>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            className={`text-xl ${
              rating >= n ? "text-yellow-500" : "text-gray-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write anonymous comment (optional)"
        className="w-full border rounded p-2 text-sm"
      />

      <button
        onClick={submitReview}
        disabled={loading}
        className="mt-2 bg-black text-white px-3 py-1 rounded text-sm"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </div>
  );
}
