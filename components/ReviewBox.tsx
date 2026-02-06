"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CelebrationOverlay from "./CelebrationOverlay";

declare global {
  interface Window {
    grecaptcha?: any;
  }
}

export default function ReviewBox({
  facultyId,
}: {
  facultyId: number;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  // Load reCAPTCHA v3 script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  const submitReview = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Get reCAPTCHA token
      let recaptchaToken = "";
      if (window.grecaptcha && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        recaptchaToken = await window.grecaptcha.execute(
          process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
          { action: "submit_review" }
        );
      }

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          facultyId,
          rating,
          comment: comment || null,
          recaptchaToken, // Add CAPTCHA token
        }),
      });

      if (!response.ok) {
        try {
          const data = await response.json();

          // Check for rate limiting (429 status)
          if (response.status === 429) {
            setError("⚠️ This website is for reviewing teachers, not taking out your personal grudges on them. Please wait before submitting another review.");
          } else if (response.status === 400) {
            // For any 400 error, show the returned error message
            setError(data.error || "Please review your submission and try again.");
          } else {
            setError(data.error || "Failed to submit review");
          }
        } catch (parseError) {
          setError("Failed to submit review. Please try again.");
          console.error("Error parsing response:", parseError);
        }
        setLoading(false);
        return;
      }

      // Play appropriate sound and show celebration
      setDone(true);
      try {
        if (rating !== 1) {
          playClap();
        }
      } catch (e) {
        console.warn("Audio play failed", e);
      }

      setComment("");
      setRating(0);
      setTimeout(() => {
        setDone(false);
      }, 3000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Review submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  const [celebrate, setCelebrate] = useState(false);

  // Simple WebAudio synthesizers to avoid shipping asset files
  function playClap() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      // three quick claps using short noise bursts
      for (let i = 0; i < 3; i++) {
        const bufferSize = ctx.sampleRate * 0.03;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) data[j] = (Math.random() * 2 - 1) * Math.exp(-5 * j / bufferSize);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(1.0, now + i * 0.06 + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.12);
        src.connect(gain).connect(ctx.destination);
        src.start(now + i * 0.06);
      }
      // light tonal flourish
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now + 0.18);
      g.gain.setValueAtTime(0.001, now + 0.18);
      g.gain.linearRampToValueAtTime(0.12, now + 0.185);
      g.gain.linearRampToValueAtTime(0.001, now + 0.5);
      osc.connect(g).connect(ctx.destination);
      osc.start(now + 0.18);
      osc.stop(now + 0.55);
      setCelebrate(true);
    } catch (e) {
      console.warn(e);
    }
  }

  return (
    <>
      {celebrate && <CelebrationOverlay onDone={() => setCelebrate(false)} />}
      <AnimatePresence>
        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mt-6 p-4 md:p-6 rounded-lg bg-emerald-900/30 border border-emerald-700/50"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-emerald-300 text-center font-semibold text-lg"
            >
              ✅ Review submitted
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 md:p-6 rounded-2xl futuristic-card neon-border"
          >
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Rating Stars */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-slate-300 mb-3 block">
                Rate this professor
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <motion.button
                    key={n}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onMouseEnter={() => setHoveredRating(n)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(n)}
                    className={`text-3xl transition-all duration-200 ${n <= (hoveredRating || rating)
                      ? "text-amber-400"
                      : "text-slate-600 hover:text-slate-500"
                      }`}
                  >
                    ★
                  </motion.button>
                ))}
              </div>
              {rating > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-slate-400 mt-2"
                >
                  Rating: <span className="text-amber-400 font-semibold">{rating}/5</span>
                </motion.p>
              )}
            </div>

            {/* Comment Textarea */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-slate-300 mb-2 block">
                Your feedback (optional)
              </label>
              <motion.textarea
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileFocus={{ scale: 1.02 }}
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                placeholder="Share your experience..."
                className="w-full p-4 rounded-lg bg-slate-700 text-slate-50 placeholder-slate-500 border border-slate-600 focus:border-indigo-500 focus:bg-slate-700/80 focus:outline-none transition-all duration-300 resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-slate-500 mt-1">{comment.length}/500 characters</p>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={submitReview}
              disabled={loading || rating === 0}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 neon-btn ${loading || rating === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Submitting...
                </span>
              ) : (
                "Submit Review"
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
