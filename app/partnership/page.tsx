"use client";
import { useState } from "react";

const BENEFITS = [
  { icon: "🎯", title: "優惠療程曝光", desc: "優惠方案自動出現在「優惠療程搜尋」頁面，直連 LINE OA" },
  { icon: "🏥", title: "診所頁面升級", desc: "展示醫師團隊、診所環境 Gallery、完整優惠資訊" },
  { icon: "📊", title: "數據看板", desc: "專屬後台查看頁面瀏覽、預約量、上架優惠狀況" },
  { icon: "🤖", title: "AI智能導流", desc: "360 LINE AI顧問主動推薦用戶至您的診所頁面" },
];

export default function PartnershipPage() {
  const [form, setForm] = useState({ clinic_name: "", contact: "", inquiry: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [lineUrl, setLineUrl] = useState("https://lin.ee/6sTCRzm");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clinic_name || !form.contact) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/partnership/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.line_url) setLineUrl(data.line_url);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Hero */}
      <div className="border-b border-[var(--line)] bg-white px-4 pb-12 pt-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--blue-xl)] text-3xl">
          🤝
        </div>
        <h1 className="mb-3 text-3xl font-black text-[var(--ink)] md:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>
          我想合作
        </h1>
        <p className="mx-auto max-w-[480px] text-[14px] leading-relaxed text-[var(--muted)]">
          加入 360醫療AI大調查合作計畫，讓您的診所被更多潛在患者看見
        </p>
      </div>

      <div className="mx-auto max-w-[960px] px-4 py-12 md:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* 左：合作優惠 */}
          <div>
            <h2 className="mb-6 text-[18px] font-bold text-[var(--ink)]">合作方案包含</h2>
            <div className="space-y-4">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex gap-4 rounded-[12px] border border-[var(--line)] bg-white p-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-[var(--blue-xl)] text-xl">
                    {b.icon}
                  </div>
                  <div>
                    <p className="font-bold text-[var(--ink)]">{b.title}</p>
                    <p className="mt-0.5 text-[13px] text-[var(--muted)]">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-700">
              <strong>早鳥優惠：</strong>現在加入即享首 3 個月免費體驗，無需信用卡。洽談完成後立即開通後台。
            </div>
          </div>

          {/* 右：表單 */}
          <div>
            {status === "done" ? (
              <div className="rounded-[14px] border border-[var(--line)] bg-white p-8 text-center">
                <div className="mb-4 text-4xl">✅</div>
                <h3 className="mb-2 text-[18px] font-bold text-[var(--ink)]">收到您的合作申請！</h3>
                <p className="mb-6 text-[13px] text-[var(--muted)]">
                  我們已收到您的資料，請點下方按鈕加入 LINE OA，我們將由專人與您聯繫說明合作細節。
                </p>
                <a
                  href={lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full rounded-[8px] bg-[#06C755] py-3 text-[14px] font-bold text-white shadow-[0_2px_8px_rgba(6,199,85,.3)] transition-opacity hover:opacity-90"
                >
                  加入 LINE OA 繼續洽談
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-[14px] border border-[var(--line)] bg-white p-6 space-y-4">
                <h2 className="text-[18px] font-bold text-[var(--ink)]">填寫合作申請</h2>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[var(--ink)]">
                    診所名稱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.clinic_name}
                    onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
                    placeholder="例：台北信義美醫診所"
                    className="w-full rounded-[8px] border border-[var(--line)] px-3 py-2.5 text-[14px] text-[var(--ink)] focus:border-[var(--blue)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[var(--ink)]">
                    聯絡方式（電話或 Email） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    placeholder="0912-345-678 或 contact@clinic.com"
                    className="w-full rounded-[8px] border border-[var(--line)] px-3 py-2.5 text-[14px] text-[var(--ink)] focus:border-[var(--blue)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[var(--ink)]">詢問內容</label>
                  <textarea
                    rows={4}
                    value={form.inquiry}
                    onChange={(e) => setForm({ ...form, inquiry: e.target.value })}
                    placeholder="請描述您的診所規模、主要療程項目，或對合作方案的問題..."
                    className="w-full resize-none rounded-[8px] border border-[var(--line)] px-3 py-2.5 text-[14px] text-[var(--ink)] focus:border-[var(--blue)] focus:outline-none"
                  />
                </div>
                {status === "error" && (
                  <p className="text-[13px] text-red-500">送出失敗，請稍後再試或直接加 LINE 聯繫。</p>
                )}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full rounded-[8px] bg-[var(--blue)] py-3 text-[14px] font-bold text-white shadow-[0_2px_8px_rgba(0,70,184,.2)] transition-opacity disabled:opacity-60 hover:opacity-90"
                >
                  {status === "loading" ? "送出中..." : "送出申請"}
                </button>
                <p className="text-center text-[12px] text-[var(--muted)]">
                  或直接{" "}
                  <a href="https://lin.ee/6sTCRzm" target="_blank" rel="noopener noreferrer" className="text-[#06C755] font-medium">
                    加 LINE OA
                  </a>{" "}
                  與我們聯繫
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
