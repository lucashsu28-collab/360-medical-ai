"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface PromotionItem {
  id: number;
  title: string;
  price?: string;
  description?: string;
  valid_until?: string;
  category?: string;
  body_part?: string;
  effect?: string;
  clinic_id: string;
  clinic_name: string;
  city?: string;
  district?: string;
  is_partner: boolean;
  line_oa_url?: string;
}

interface FilterOptions {
  categories: string[];
  parts: string[];
  effects: string[];
  price_ranges: string[];
}

const PRICE_RANGES = [
  { label: "全部", value: "" },
  { label: "5,000 以下", value: "0-5000" },
  { label: "5,001–20,000", value: "5001-20000" },
  { label: "20,001–50,000", value: "20001-50000" },
  { label: "50,000 以上", value: "50001-999999" },
];

export default function PromotionsPage() {
  const [items, setItems] = useState<PromotionItem[]>([]);
  const [options, setOptions] = useState<FilterOptions>({ categories: [], parts: [], effects: [], price_ranges: [] });
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [part, setPart] = useState("");
  const [effect, setEffect] = useState("");
  const [priceRange, setPriceRange] = useState("");

  useEffect(() => {
    fetch("/api/promotions/categories")
      .then((r) => r.json())
      .then(setOptions)
      .catch(() => {});
  }, []);

  const loadItems = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (part) params.set("part", part);
    if (effect) params.set("effect", effect);
    if (priceRange) params.set("price_range", priceRange);
    fetch(`/api/promotions?${params}`)
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [category, part, effect, priceRange]);

  useEffect(() => { loadItems(); }, [loadItems]);

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Hero */}
      <div className="border-b border-[var(--line)] bg-white px-4 pb-8 pt-10 text-center">
        <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,70,184,.1)] bg-[var(--blue-lt)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--blue)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--blue)]" />
          優惠療程搜尋
        </div>
        <h2 className="mb-2 text-2xl font-[900] tracking-tight text-[var(--ink)] md:text-3xl" style={{ fontFamily: "var(--font-noto-serif-tc)" }}>
          合作診所<span className="text-[var(--blue)]">優惠療程</span>
        </h2>
        <p className="mx-auto max-w-[560px] text-[12px] leading-relaxed text-[var(--muted)]">
          以下優惠由合作診所提供，非平台評鑑推薦。點選療程可直接透過 LINE OA 預約。
        </p>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-10 border-b border-[var(--line)] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,.04)]">
        <div className="mx-auto flex max-w-[1060px] flex-wrap gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[13px] text-[var(--ink)] focus:border-[var(--blue)] focus:outline-none"
          >
            <option value="">全部大類</option>
            {options.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={part}
            onChange={(e) => setPart(e.target.value)}
            className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[13px] text-[var(--ink)] focus:border-[var(--blue)] focus:outline-none"
          >
            <option value="">全部部位</option>
            {options.parts.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={effect}
            onChange={(e) => setEffect(e.target.value)}
            className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[13px] text-[var(--ink)] focus:border-[var(--blue)] focus:outline-none"
          >
            <option value="">全部效果</option>
            {options.effects.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[13px] text-[var(--ink)] focus:border-[var(--blue)] focus:outline-none"
          >
            {PRICE_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          {(category || part || effect || priceRange) && (
            <button
              onClick={() => { setCategory(""); setPart(""); setEffect(""); setPriceRange(""); }}
              className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-[13px] text-[var(--muted)] hover:border-red-300 hover:text-red-500"
            >
              清除篩選
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="mx-auto max-w-[1060px] px-4 py-6 md:px-8">
        {loading ? (
          <div className="py-20 text-center text-[var(--muted)]">載入中...</div>
        ) : items.length === 0 ? (
          <div className="rounded-[14px] border border-[var(--line)] bg-white py-16 text-center text-[var(--muted)]">
            目前沒有符合條件的優惠療程。
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col rounded-[14px] border bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.04)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,.08)] ${item.is_partner ? "border-amber-300" : "border-[var(--line)]"}`}
              >
                {item.is_partner && (
                  <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    ✦ 合作診所
                  </span>
                )}
                {item.category && (
                  <span className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--blue)]">
                    {item.category}
                  </span>
                )}
                <p className="mb-1 text-[15px] font-bold text-[var(--ink)]">{item.title}</p>
                {item.price && <p className="text-[14px] font-semibold text-amber-700">{item.price}</p>}
                {item.description && <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted)]">{item.description}</p>}
                {item.valid_until && <p className="mt-2 text-[11px] text-[var(--muted)]">有效期至 {item.valid_until}</p>}
                <div className="mt-auto pt-3 border-t border-[var(--line)]">
                  <Link href={`/clinics/${item.clinic_id}`} className="text-[13px] font-medium text-[var(--ink2)] hover:text-[var(--blue)]">
                    {item.clinic_name}
                    {item.city && <span className="text-[var(--muted)]"> · {item.city}</span>}
                  </Link>
                </div>
                <a
                  href={item.line_oa_url || "https://lin.ee/6sTCRzm"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block w-full rounded-[8px] bg-[#06C755] py-2.5 text-center text-[13px] font-bold text-white shadow-[0_2px_6px_rgba(6,199,85,.25)] transition-opacity hover:opacity-90"
                >
                  LINE 預約此療程
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <section className="border-t border-[var(--line)] bg-white px-4 py-10">
        <div className="mx-auto max-w-[560px] rounded-[14px] border border-[var(--line)] bg-[var(--blue-xl)] p-8 text-center">
          <p className="mb-1 text-[15px] font-bold text-[var(--ink)]">診所業者想上架優惠？</p>
          <p className="mb-4 text-[13px] text-[var(--muted)]">加入合作計畫即可在此頁展示優惠療程</p>
          <Link
            href="/partnership"
            className="inline-block rounded-[8px] bg-[var(--blue)] px-8 py-3 text-[14px] font-bold text-white shadow-[0_2px_8px_rgba(0,70,184,.2)] transition-colors hover:bg-[var(--blue2)]"
          >
            了解合作方案 →
          </Link>
        </div>
      </section>
    </div>
  );
}
