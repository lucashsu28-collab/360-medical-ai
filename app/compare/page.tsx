import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "醫美診所比較｜360醫療AI大調查",
  description: "同時比較多家醫美診所的六維度評分，快速找出最適合您的診所。",
};

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <div className="mx-auto max-w-[1060px] px-4 py-8 md:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)] mb-2">診所比較</h1>
          <p className="text-[var(--muted)] text-sm">同時比較多家診所六維度評分，找出最值得信賴的醫美診所</p>
        </div>
        <div className="rounded-[14px] border border-[var(--line)] bg-white p-8 text-center">
          <div className="text-4xl mb-4">⚖️</div>
          <h2 className="text-[16px] font-bold text-[var(--ink)] mb-2">診所比較功能即將上線</h2>
          <p className="text-[13px] text-[var(--muted)]">您可以先到診所列表頁查看各診所的六維度評分</p>
        </div>
      </div>
    </div>
  );
}
