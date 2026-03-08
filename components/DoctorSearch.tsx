"use client";

import { useState, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export interface DoctorListItem {
  name: string;
  area: string;
  doc_seq: string;
}

export interface DoctorDetail {
  人員姓名?: string;
  性別?: string;
  執業縣市?: string;
  主要執業科別?: string;
  主要執登類別?: string;
  證書類別?: string;
  專科資格?: string;
  [key: string]: string | undefined;
}

interface DoctorSearchProps {
  /** 是否為嵌入式（診所頁本院醫師），標題與版面較精簡 */
  embedded?: boolean;
}

export default function DoctorSearch({ embedded = false }: DoctorSearchProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [detailDocSeq, setDetailDocSeq] = useState<string | null>(null);
  const [detail, setDetail] = useState<DoctorDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const search = useCallback(async () => {
    const name = query.trim();
    if (!name) {
      setDoctors([]);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/doctors?name=${encodeURIComponent(name)}`
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

  const openDetail = useCallback(async (docSeq: string) => {
    setDetailDocSeq(docSeq);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/doctors/detail?doc_seq=${encodeURIComponent(docSeq)}`
      );
      if (!res.ok) throw new Error("取得詳細資料失敗");
      const data = await res.json();
      setDetail(data.doctor ?? {});
    } catch (e) {
      setDetail({ 人員姓名: "無法載入" });
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetailDocSeq(null);
    setDetail(null);
  }, []);

  const detailFields = [
    "人員姓名",
    "性別",
    "執業縣市",
    "主要執業科別",
    "主要執登類別",
    "證書類別",
    "專科資格",
  ] as const;

  return (
    <div
      className={
        embedded
          ? "space-y-4"
          : "mx-auto max-w-[640px] space-y-6 rounded-[14px] border border-[var(--line)] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,.04)]"
      }
    >
      {!embedded && (
        <h2 className="text-[16px] font-bold text-[var(--ink)]">醫師搜尋</h2>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="輸入醫師姓名"
          className="min-w-0 flex-1 rounded-[8px] border border-[var(--line)] bg-white px-3 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--blue)] focus:outline-none"
          aria-label="醫師姓名"
        />
        <button
          type="button"
          onClick={search}
          disabled={loading}
          className="rounded-[8px] bg-[var(--blue)] px-4 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-[var(--blue2)] disabled:opacity-60"
        >
          {loading ? "搜尋中…" : "搜尋"}
        </button>
      </div>
      {error && (
        <p className="text-[13px] text-[var(--red)]">{error}</p>
      )}
      {doctors.length > 0 && (
        <div className="space-y-3">
          {!embedded && (
            <p className="text-[13px] text-[var(--muted)]">
              共 {doctors.length} 筆
            </p>
          )}
          <ul className="space-y-2">
            {doctors.map((d) => (
              <li
                key={d.doc_seq}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-[10px] border border-[var(--line)] bg-white px-4 py-3 transition-all hover:border-[var(--blue)] hover:shadow-[0_2px_8px_rgba(0,0,0,.06)]"
              >
                <div>
                  <div className="text-[15px] font-bold text-[var(--ink)]">
                    {d.name}
                  </div>
                  <div className="text-[12px] text-[var(--muted)]">
                    {d.area}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openDetail(d.doc_seq)}
                  className="rounded-[6px] border border-[var(--line)] bg-[var(--off)] px-3 py-1.5 text-[12px] font-bold text-[var(--ink2)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)]"
                >
                  查看詳細
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!loading && query.trim() && doctors.length === 0 && !error && (
        <p className="text-[13px] text-[var(--muted)]">查無符合的醫師</p>
      )}

      {/* 詳細 Modal */}
      {detailDocSeq !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="doctor-detail-title"
          onClick={closeDetail}
        >
          <div
            className="max-h-[85vh] w-full max-w-[420px] overflow-auto rounded-[14px] border border-[var(--line)] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="doctor-detail-title"
              className="mb-4 text-[16px] font-bold text-[var(--ink)]"
            >
              醫師詳細資料
            </h3>
            {detailLoading ? (
              <p className="text-[13px] text-[var(--muted)]">載入中…</p>
            ) : detail ? (
              <dl className="space-y-3">
                {detailFields.map((key) => (
                  <div key={key} className="flex gap-2 text-[13px]">
                    <dt className="w-[120px] shrink-0 text-[var(--muted)]">
                      {key}
                    </dt>
                    <dd className="min-w-0 text-[var(--ink2)]">
                      {detail[key] ?? "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-[8px] bg-[var(--off)] px-4 py-2 text-[13px] font-bold text-[var(--ink)] hover:bg-[var(--line)]"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
