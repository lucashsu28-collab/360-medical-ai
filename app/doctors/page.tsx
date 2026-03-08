"use client";

import Link from "next/link";
import { useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface Doctor {
  name: string;
  area: string;
  doc_seq: string;
}

interface DoctorDetail {
  人員姓名: string;
  性別: string;
  執業縣市: string;
  主要執業科別: string;
  主要執登類別: string;
  證書類別: string;
  專科資格: string;
}

const DETAIL_KEYS: (keyof DoctorDetail)[] = [
  "人員姓名",
  "性別",
  "執業縣市",
  "主要執業科別",
  "主要執登類別",
  "證書類別",
  "專科資格",
];

export default function DoctorsPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [expandedDocSeq, setExpandedDocSeq] = useState<string | null>(null);
  const [detail, setDetail] = useState<DoctorDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const search = useCallback(async () => {
    const name = query.trim();
    if (!name) {
      setDoctors([]);
      setExpandedDocSeq(null);
      setDetail(null);
      return;
    }
    setError(null);
    setLoading(true);
    setExpandedDocSeq(null);
    setDetail(null);
    try {
      const res = await fetch(
        `${API_URL}/api/doctors?name=${encodeURIComponent(name)}`
      );
      if (!res.ok) throw new Error("搜尋失敗");
      const data = await res.json();
      setDoctors(data.doctors ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "搜尋失敗");
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const toggleDetail = useCallback(async (docSeq: string) => {
    if (expandedDocSeq === docSeq) {
      setExpandedDocSeq(null);
      setDetail(null);
      return;
    }
    setExpandedDocSeq(docSeq);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/doctors/detail?doc_seq=${encodeURIComponent(docSeq)}`
      );
      if (!res.ok) throw new Error("取得詳細資料失敗");
      const data = await res.json();
      setDetail(data.doctor ?? {});
    } catch {
      setDetail({
        人員姓名: "—",
        性別: "—",
        執業縣市: "—",
        主要執業科別: "—",
        主要執登類別: "—",
        證書類別: "—",
        專科資格: "—",
      });
    } finally {
      setDetailLoading(false);
    }
  }, [expandedDocSeq]);

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Hero + Search */}
      <div className="border-b border-[var(--line)] bg-white px-4 pb-8 pt-10 text-center md:px-6 md:pt-10 md:pb-8">
        <div className="relative z-10 mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,70,184,.1)] bg-[var(--blue-lt)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--blue)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--blue)]" />
          衛福部醫事人員查詢
        </div>
        <h2
          className="relative z-10 mb-2 text-2xl font-[900] tracking-tight text-[var(--ink)] md:text-3xl lg:text-4xl"
          style={{ fontFamily: "var(--font-noto-serif-tc)" }}
        >
          醫師<span className="text-[var(--blue)]">查詢</span>
        </h2>
        <p className="relative z-10 mb-6 text-sm text-[var(--muted)]">
          輸入醫師姓名，查詢執業縣市、科別、證書類別
        </p>
        <div className="relative z-10 mx-auto flex max-w-[560px] flex-wrap items-stretch gap-2 rounded-[12px] border border-[var(--line)] bg-white shadow-[0_6px_24px_rgba(0,0,0,.09)] focus-within:border-[var(--blue)] focus-within:shadow-[0_6px_24px_rgba(0,70,184,.14)]">
          <span className="flex items-center pl-[18px] pr-2 text-[18px]" aria-hidden>👤</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="輸入醫師姓名…"
            className="min-w-0 flex-1 py-[14px] text-[15px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none"
            aria-label="醫師姓名"
          />
          <button
            type="button"
            onClick={search}
            disabled={loading}
            className="m-[7px] rounded-[8px] bg-[var(--blue)] px-[22px] py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-[var(--blue2)] disabled:opacity-60"
          >
            {loading ? "搜尋中…" : "搜尋"}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-[1060px] px-4 py-6 md:px-8 md:py-8">
        <nav className="mb-6 text-[12px] text-[var(--muted)]" aria-label="麵包屑">
          <Link href="/" className="hover:text-[var(--blue)]">首頁</Link>
          <span className="mx-1.5">/</span>
          <span className="text-[var(--ink)]">醫師查詢</span>
        </nav>

        {error && (
          <p className="mb-4 text-[13px] text-[var(--red)]">{error}</p>
        )}

        {doctors.length > 0 && (
          <p className="mb-4 text-[13px] text-[var(--muted)]">
            共找到 <strong className="font-bold text-[var(--ink)]">{doctors.length}</strong> 筆
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          {loading && (
            <div className="rounded-[14px] border border-[var(--line)] bg-white py-12 text-center text-[var(--muted)]">
              搜尋中…
            </div>
          )}
          {!loading && query.trim() && doctors.length === 0 && !error && (
            <div className="rounded-[14px] border border-[var(--line)] bg-white py-16 text-center text-[var(--muted)]">
              查無符合的醫師，請試試其他關鍵字。
            </div>
          )}
          {!loading &&
            doctors.map((d) => (
              <div
                key={d.doc_seq}
                className="overflow-hidden rounded-[14px] border-[1.5px] border-[var(--line)] bg-white transition-all duration-[0.22s] hover:border-[var(--blue)] hover:shadow-[0_12px_40px_rgba(0,0,0,.1)]"
              >
                <div className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <div className="text-[16px] font-bold text-[var(--ink)]">
                      {d.name}
                    </div>
                    <div className="text-[12px] text-[var(--muted)]">
                      {d.area}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleDetail(d.doc_seq)}
                    className="rounded-[8px] border border-[var(--line)] bg-[var(--off)] px-4 py-2 text-[13px] font-bold text-[var(--ink2)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)]"
                  >
                    {expandedDocSeq === d.doc_seq ? "收合詳細" : "查看詳細"}
                  </button>
                </div>
                {expandedDocSeq === d.doc_seq && (
                  <div className="border-t border-[var(--line)] bg-[var(--off)] px-5 py-4">
                    {detailLoading ? (
                      <p className="text-[13px] text-[var(--muted)]">
                        載入中…
                      </p>
                    ) : detail ? (
                      <dl className="grid gap-x-4 gap-y-2 text-[13px] sm:grid-cols-[auto_1fr]">
                        {DETAIL_KEYS.map((key) => (
                          <div key={key} className="contents">
                            <dt className="text-[var(--muted)]">{key}</dt>
                            <dd className="text-[var(--ink2)]">
                              {detail[key] ?? "—"}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
