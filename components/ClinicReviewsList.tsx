"use client";
import { useEffect, useState } from "react";

interface Review {
  author_name: string;
  rating: number;
  text: string;
  relative_time: string;
}

export default function ClinicReviewsList({ clinicId, limit }: { clinicId: string; limit?: number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 透過 Next.js API Route proxy（/app/api/clinics/[id]/reviews/route.ts）
    // 避免跨域，前端只用相對路徑
    fetch(`/api/clinics/${clinicId}/reviews`)
      .then((r) => r.json())
      .then((data) => { setReviews(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [clinicId]);

  if (loading) return (
    <div className="mt-4 text-sm text-[var(--muted)]">載入評論中…</div>
  );
  if (reviews.length === 0) return null;

  const displayReviews = limit ? reviews.slice(0, limit) : reviews;

  return (
    <div className="mt-4 space-y-3">
      {displayReviews.map((r, i) => (
        <div key={i} className="border-t border-[var(--line)] pt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm text-[var(--ink)]">{r.author_name}</span>
            <span className="text-xs text-[var(--muted)]">{r.relative_time}</span>
          </div>
          <div className="flex mb-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={s <= r.rating ? "text-yellow-400" : "text-gray-200"}>★</span>
            ))}
          </div>
          <p className="text-sm text-[var(--ink2)] line-clamp-3">{r.text}</p>
        </div>
      ))}
    </div>
  );
}
