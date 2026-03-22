"use client";

import { useState } from "react";

const FIELDS = [
  { id: "clinic_name",  label: "診所名稱",        type: "text",     placeholder: "請輸入診所全名", required: true },
  { id: "clinic_addr",  label: "診所地址",        type: "text",     placeholder: "縣市 + 詳細地址", required: true },
  { id: "contact_name", label: "聯絡人姓名",      type: "text",     placeholder: "負責人或授權人員姓名", required: true },
  { id: "contact_tel",  label: "聯絡電話",        type: "tel",      placeholder: "02-XXXX-XXXX 或 09XX-XXX-XXX", required: true },
  { id: "contact_email","label": "聯絡 Email",    type: "email",    placeholder: "example@clinic.com", required: true },
] as const;

type FormState = Record<string, string>;

export default function ClinicUpdatePage() {
  const [form, setForm] = useState<FormState>({
    clinic_name: "", clinic_addr: "", contact_name: "",
    contact_tel: "", contact_email: "", update_content: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(id: string, value: string) {
    setForm((prev) => ({ ...prev, [id]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // P3 再串後端 API；目前僅前端模擬
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  }

  return (
    <main className="min-h-[calc(100vh-62px)] bg-[var(--paper)]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white px-4 pb-10 pt-14 text-center md:px-6 md:pb-12 md:pt-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: "radial-gradient(var(--line) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-xl">
          <span className="mb-4 inline-block rounded-full bg-[var(--blue-lt)] px-4 py-1.5 text-xs font-semibold tracking-wider text-[var(--blue)]">
            診所資料更新申請
          </span>
          <h1
            className="mb-4 text-2xl font-black leading-snug text-[var(--ink)] md:text-3xl"
            style={{ fontFamily: "var(--font-noto-serif-tc)" }}
          >
            醫美診所免費更新資料
          </h1>
          <p className="text-[14px] leading-relaxed text-[var(--muted)]">
            如您是診所負責人或授權人員，可透過此入口申請更新診所資料，
            資料經審核後將於平台上更新顯示。
          </p>
        </div>
      </section>

      {/* 表單 / 成功訊息 */}
      <section className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-xl">
          {submitted ? (
            /* 送出成功 */
            <div className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-8 py-12 text-center shadow-[0_2px_16px_rgba(0,135,90,0.08)]">
              <div className="mb-4 text-5xl">✅</div>
              <h2 className="mb-3 text-xl font-bold text-[#15803D]">申請已收到！</h2>
              <p className="text-[14px] leading-relaxed text-[#166534]">
                感謝您的申請，我們將於 <strong>3 個工作天</strong>內與您聯繫，
                <br />
                請注意來自平台的 Email 或電話通知。
              </p>
              <button
                onClick={() => { setSubmitted(false); setForm({ clinic_name: "", clinic_addr: "", contact_name: "", contact_tel: "", contact_email: "", update_content: "" }); }}
                className="mt-8 rounded-xl border border-[#BBF7D0] bg-white px-6 py-2.5 text-sm font-semibold text-[#15803D] transition hover:bg-[#F0FDF4]"
              >
                再提交一筆
              </button>
            </div>
          ) : (
            /* 表單 */
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-[var(--line)] bg-white px-6 py-8 shadow-[0_2px_16px_rgba(0,0,0,0.05)] md:px-8 md:py-10"
            >
              {/* 注意事項 */}
              <div className="mb-8 rounded-xl border border-[var(--blue-lt)] bg-[var(--blue-xl)] px-4 py-3.5 text-[13px] leading-relaxed text-[var(--blue)]">
                <strong>注意事項：</strong>本申請僅限診所負責人或經授權人員填寫。
                提交後平台將進行人工審核，若資料有誤將無法通過審核。
              </div>

              <div className="space-y-5">
                {FIELDS.map(({ id, label, type, placeholder, required }) => (
                  <div key={id}>
                    <label
                      htmlFor={id}
                      className="mb-1.5 block text-sm font-semibold text-[var(--ink2)]"
                    >
                      {label}
                      {required && <span className="ml-1 text-[var(--red)]">*</span>}
                    </label>
                    <input
                      id={id}
                      type={type}
                      required={required}
                      value={form[id]}
                      onChange={(e) => handleChange(id, e.target.value)}
                      placeholder={placeholder}
                      className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white focus:ring-2 focus:ring-[var(--blue-lt)]"
                    />
                  </div>
                ))}

                {/* 想更新的內容 */}
                <div>
                  <label
                    htmlFor="update_content"
                    className="mb-1.5 block text-sm font-semibold text-[var(--ink2)]"
                  >
                    想更新的內容
                    <span className="ml-1 text-[var(--red)]">*</span>
                  </label>
                  <textarea
                    id="update_content"
                    required
                    rows={5}
                    value={form.update_content}
                    onChange={(e) => handleChange("update_content", e.target.value)}
                    placeholder="請描述您想更新的資料，例如：診所地址已變更為…、電話更新為…、補充診所簡介…"
                    className="w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white focus:ring-2 focus:ring-[var(--blue-lt)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-8 w-full rounded-xl bg-[var(--blue)] py-3 text-[15px] font-bold text-white shadow-[0_2px_12px_rgba(0,70,184,0.22)] transition-all duration-150 hover:bg-[var(--blue2)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "送出中…" : "送出申請"}
              </button>

              <p className="mt-4 text-center text-xs text-[var(--muted)]">
                送出後將由專人審核，審核結果以 Email 通知
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
