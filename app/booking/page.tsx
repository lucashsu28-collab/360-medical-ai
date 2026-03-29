"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const LIFF_ID = "2009360724-7DzjBKHU";
const API = process.env.NEXT_PUBLIC_API_URL || "";

const STEPS = ["選擇療程", "選擇時間", "填寫資料", "備註確認", "完成預約"];

const TREATMENTS = [
  "皮秒雷射", "玻尿酸", "肉毒桿菌", "電波拉皮", "飛梭雷射",
  "雙眼皮", "隆鼻", "除毛雷射", "痘疤治療", "其他諮詢",
];

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00",
];

interface LiffProfile {
  userId: string;
  displayName: string;
}

function BookingContent() {
  const searchParams = useSearchParams();
  const clinicId = searchParams.get("clinic_id") || "";
  const clinicName = searchParams.get("clinic_name") || "診所";

  const [step, setStep] = useState(0);
  const [liffProfile, setLiffProfile] = useState<LiffProfile | null>(null);
  const [liffReady, setLiffReady] = useState(false);

  const [form, setForm] = useState({
    treatment: "",
    date: "",
    time: "",
    name: "",
    phone: "",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // LIFF init
  useEffect(() => {
    import("@line/liff").then(({ default: liff }) => {
      liff.init({ liffId: LIFF_ID }).then(() => {
        setLiffReady(true);
        if (liff.isLoggedIn()) {
          liff.getProfile().then((p) => setLiffProfile({ userId: p.userId, displayName: p.displayName }));
        } else {
          liff.login();
        }
      }).catch(() => setLiffReady(true));
    }).catch(() => setLiffReady(true));
  }, []);

  async function handleSubmit() {
    if (!form.treatment || !form.date || !form.name || !form.phone) {
      setError("請填寫必填項目");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_id: clinicId,
          treatment_name: form.treatment,
          preferred_date: form.date,
          preferred_time: form.time,
          user_display_name: form.name,
          user_phone: form.phone,
          user_line_id: liffProfile?.userId || null,
          note: form.note,
        }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        setError("預約失敗，請稍後再試");
      }
    } catch {
      setError("連線失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  }

  if (!liffReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-[14px] text-gray-500">載入中...</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <div className="mb-4 text-5xl">✅</div>
        <h1 className="mb-2 text-[20px] font-black text-gray-900">預約成功！</h1>
        <p className="mb-2 text-[14px] text-gray-500">{clinicName}</p>
        <p className="mb-6 text-[13px] leading-relaxed text-gray-500">
          我們已收到您的預約，諮詢師將在 LINE 上與您聯繫確認時間。
        </p>
        <div className="rounded-[12px] bg-green-50 p-4 text-[13px] text-green-700 w-full max-w-sm">
          療程：{form.treatment}<br />
          日期：{form.date} {form.time}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-4">
        <p className="text-[11px] text-gray-400">預約諮詢</p>
        <h1 className="text-[16px] font-bold text-gray-900">{clinicName}</h1>
      </div>

      {/* Steps */}
      <div className="flex px-4 py-3 gap-1">
        {STEPS.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${i < step ? "bg-green-500 text-white" : i === step ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400"}`}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`text-[9px] text-center ${i === step ? "text-blue-500 font-semibold" : "text-gray-400"}`}>{s}</span>
          </div>
        ))}
      </div>

      <div className="px-4 py-4">
        {/* Step 0: 選擇療程 */}
        {step === 0 && (
          <div>
            <p className="mb-4 text-[14px] font-semibold text-gray-900">想了解哪種療程？</p>
            <div className="grid grid-cols-2 gap-2">
              {TREATMENTS.map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, treatment: t })}
                  className={`rounded-[10px] border py-3 text-[13px] font-medium transition-all ${form.treatment === t ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: 選擇時間 */}
        {step === 1 && (
          <div>
            <p className="mb-3 text-[14px] font-semibold text-gray-900">選擇日期</p>
            <input
              type="date"
              value={form.date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mb-4 w-full rounded-[10px] border border-gray-200 px-4 py-3 text-[14px] focus:border-blue-500 focus:outline-none"
            />
            <p className="mb-3 text-[14px] font-semibold text-gray-900">選擇時段</p>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, time: t })}
                  className={`rounded-[10px] border py-2.5 text-[13px] font-medium ${form.time === t ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: 填寫資料 */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-[14px] font-semibold text-gray-900">填寫聯絡資料</p>
            <div>
              <label className="mb-1.5 block text-[12px] text-gray-500">姓名 *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={liffProfile?.displayName || "您的姓名"}
                className="w-full rounded-[10px] border border-gray-200 px-4 py-3 text-[14px] focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] text-gray-500">電話 *</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0912-345-678"
                className="w-full rounded-[10px] border border-gray-200 px-4 py-3 text-[14px] focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: 備註確認 */}
        {step === 3 && (
          <div>
            <p className="mb-3 text-[14px] font-semibold text-gray-900">備註（選填）</p>
            <textarea
              rows={3}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="例：有特別需求或問題..."
              className="mb-4 w-full resize-none rounded-[10px] border border-gray-200 px-4 py-3 text-[14px] focus:border-blue-500 focus:outline-none"
            />
            <div className="rounded-[12px] bg-gray-50 p-4 text-[13px] space-y-1.5">
              <p className="font-semibold text-gray-900 mb-2">預約確認</p>
              <p className="text-gray-600">診所：{clinicName}</p>
              <p className="text-gray-600">療程：{form.treatment}</p>
              <p className="text-gray-600">日期：{form.date} {form.time}</p>
              <p className="text-gray-600">姓名：{form.name}</p>
              <p className="text-gray-600">電話：{form.phone}</p>
            </div>
          </div>
        )}

        {/* Step 4: Complete (handled above as done state) */}

        {error && <p className="mt-3 text-[13px] text-red-500">{error}</p>}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 py-3 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 rounded-[10px] border border-gray-200 py-3 text-[14px] font-semibold text-gray-600"
          >
            上一步
          </button>
        )}
        {step < 3 ? (
          <button
            onClick={() => {
              if (step === 0 && !form.treatment) { setError("請選擇療程"); return; }
              if (step === 1 && !form.date) { setError("請選擇日期"); return; }
              if (step === 2 && (!form.name || !form.phone)) { setError("請填寫姓名和電話"); return; }
              setError("");
              setStep(step + 1);
            }}
            className="flex-1 rounded-[10px] bg-blue-500 py-3 text-[14px] font-bold text-white"
          >
            下一步
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-[10px] bg-[#06C755] py-3 text-[14px] font-bold text-white disabled:opacity-60"
          >
            {submitting ? "送出中..." : "確認預約"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-gray-500">載入中...</p></div>}>
      <BookingContent />
    </Suspense>
  );
}
