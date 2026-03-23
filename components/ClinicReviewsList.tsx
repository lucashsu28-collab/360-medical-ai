"use client";

import { useState, useEffect } from "react";

interface Review {
  author_name: string;
  rating: number | null;
  text: string;
  relative_time: string;
}

export default function ClinicReviewsList({ clinicId }: { clinicId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${apiUrl}/api/clinics/${clinicId}/reviews`)
      .then((r) => r.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [clinicId]);

  if (loading) {
    return (
      <div className="mt-4 border-t border-[var(--line)] pt-4">
        <div className="flex gap-2 items-center text-[13px] text-[var(--muted)]">
          <span className="inline-block h-3 w-3 rounded-full bg-[var(--line)] animate-pulse" />
          載入評論中…
        </div>
      </div>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <div className="mt-4 space-y-3 border-t border-[var(--line)] pt-4">
      {reviews.map((r, i) => (
        <div key={i} className="border-t border-[var(--line)] pt-3 first:border-0 first:pt-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] font-medium text-[var(--ink)]">{r.author_name || "匿名"}</span>
            <span className="text-[11px] text-[var(--muted)]">{r.relative_time}</span>
          </div>
          <div className="flex mb-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className="text-[14px]"
                style={{ color: s <= (r.rating ?? 0) ? "var(--amber)" : "var(--line)" }}
              >
                ★
              </span>
            ))}
          </div>
          <p className="text-[13px] leading-relaxed text-[var(--ink2)] line-clamp-3">{r.text}</p>
        </div>
      ))}
    </div>
  );
}
