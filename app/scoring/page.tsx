import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "評分標準 | 360醫療AI大調查",
  description: "360醫療AI大調查採100分制評鑑，資料全部公開，包含合法登記、Google評分、司法糾紛等維度說明。",
};

function ScoreTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--off)]">
            {headers.map((h) => (
              <th
                key={h}
                className="border-b border-[var(--line)] px-4 py-3 text-left text-xs font-semibold text-[var(--muted)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={i % 2 === 0 ? "bg-white" : "bg-[var(--paper)]"}
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="border-b border-[var(--line)] px-4 py-3 font-medium text-[var(--ink2)]"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DimensionCard({
  num,
  title,
  maxScore,
  color,
  bgColor,
  children,
  pending,
}: {
  num: string;
  title: string;
  maxScore: number;
  color: string;
  bgColor: string;
  children?: React.ReactNode;
  pending?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ background: bgColor }}>
        <div className="flex items-center gap-3">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: color }}
          >
            {num}
          </span>
          <h3 className="text-base font-bold" style={{ color }}>
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {pending ? (
            <span className="rounded-full bg-[var(--off)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
              建置中
            </span>
          ) : (
            <span
              className="rounded-full px-3 py-1 text-xs font-bold"
              style={{ background: color, color: "#fff" }}
            >
              滿分 {maxScore} 分
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {pending ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--line2)] bg-[var(--off)] px-5 py-6">
            <span className="text-2xl">🚧</span>
            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">此維度正在建置中</p>
              <p className="mt-0.5 text-xs text-[var(--light)]">資料蒐集與評分規則制定中，預計 Phase 3 上線</p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default function ScoringPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white px-4 pb-12 pt-16 text-center md:px-6 md:pb-14 md:pt-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: "radial-gradient(var(--line) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-2xl">
          <span className="mb-4 inline-block rounded-full bg-[var(--blue-lt)] px-4 py-1.5 text-xs font-semibold tracking-wider text-[var(--blue)]">
            評分標準
          </span>
          <h1
            className="mb-5 text-3xl font-black leading-snug text-[var(--ink)] md:text-4xl"
            style={{ fontFamily: "var(--font-noto-serif-tc)" }}
          >
            100分制、全資料公開
            <br className="hidden md:block" />
            任何人都可以驗證
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-[var(--muted)]">
            我們的評分採 100 分制，分為五個維度，每個維度的資料來源、計算邏輯全部公開透明，
            不存在任何不透明的人工調整。
          </p>
        </div>
      </section>

      {/* 總分概覽 */}
      <section className="bg-[var(--paper)] px-4 py-10 md:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "合法登記", score: 20, color: "#0046b8", bg: "#e8f0fb" },
              { label: "Google評分", score: 20, color: "#00875a", bg: "#e0f5ec" },
              { label: "司法糾紛", score: 20, color: "#a86800", bg: "#fff3e0" },
              { label: "品牌監測", score: 20, color: "#6b7f92", bg: "#f1f5f9", pending: true },
              { label: "其他維度", score: 20, color: "#6b7f92", bg: "#f1f5f9", pending: true },
            ].map((d) => (
              <div
                key={d.label}
                className="rounded-xl p-3 text-center"
                style={{ background: d.bg }}
              >
                <div
                  className="text-xl font-black"
                  style={{ color: d.pending ? "var(--light)" : d.color }}
                >
                  {d.score}分
                </div>
                <div
                  className="mt-1 text-xs font-semibold"
                  style={{ color: d.pending ? "var(--light)" : d.color }}
                >
                  {d.label}
                </div>
                {d.pending && (
                  <div className="mt-1 text-[10px] text-[var(--light)]">建置中</div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-[var(--muted)]">
            五個維度各 20 分，合計 100 分
          </p>
        </div>
      </section>

      {/* 各維度詳細說明 */}
      <section className="bg-white px-4 py-14 md:px-6 md:py-16">
        <div className="mx-auto max-w-3xl space-y-8">

          {/* 維度一：合法登記 */}
          <DimensionCard num="1" title="合法登記" maxScore={20} color="#0046b8" bgColor="#e8f0fb">
            <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">
              資料來源：衛福部健保署醫事機構查詢系統。確認診所是否具備合法醫療機構登記，
              為所有評分維度中最基礎的門檻條件。
            </p>
            <ScoreTable
              headers={["條件", "分數"]}
              rows={[
                ["有合法登記（健保署資料庫可查詢）", "20 分"],
                ["無法查詢登記記錄", "0 分"],
              ]}
            />
          </DimensionCard>

          {/* 維度二：Google評分 */}
          <DimensionCard num="2" title="Google 評分" maxScore={20} color="#00875a" bgColor="#e0f5ec">
            <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">
              資料來源：Google Places API（每10天自動更新）。Google 評分由兩部分組成：
              <strong className="text-[var(--ink2)]">星等（15分）</strong>與
              <strong className="text-[var(--ink2)]">評論數量（5分）</strong>，合計 20 分。
            </p>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-[var(--muted)]">星等（滿分 15 分）</p>
                <ScoreTable
                  headers={["Google 星等", "分數"]}
                  rows={[
                    ["4.5 星以上", "15 分"],
                    ["4.0 ～ 4.4 星", "12 分"],
                    ["3.5 ～ 3.9 星", "9 分"],
                    ["3.0 ～ 3.4 星", "6 分"],
                    ["3.0 星以下", "3 分"],
                  ]}
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-[var(--muted)]">評論數量（滿分 5 分）</p>
                <ScoreTable
                  headers={["評論則數", "分數"]}
                  rows={[
                    ["1,000 則以上", "5 分"],
                    ["500 ～ 999 則", "4 分"],
                    ["100 ～ 499 則", "3 分"],
                    ["未達 100 則", "2 分"],
                    ["0 則（無評論）", "0 分"],
                  ]}
                />
              </div>
            </div>
          </DimensionCard>

          {/* 維度三：司法糾紛 */}
          <DimensionCard num="3" title="司法糾紛" maxScore={20} color="#a86800" bgColor="#fff3e0">
            <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">
              資料來源：司法院裁判書查詢系統（公開裁判書全文）。以診所名稱作為關鍵字，
              統計涉及醫療糾紛之民事、刑事判決案件數，案件數越多則分數越低。
            </p>
            <ScoreTable
              headers={["醫療糾紛案件數", "分數"]}
              rows={[
                ["0 件", "20 分"],
                ["1 件", "15 分"],
                ["2 件", "10 分"],
                ["3 件", "5 分"],
                ["4 件以上", "0 分"],
              ]}
            />
          </DimensionCard>

          {/* 維度四：品牌監測（建置中）*/}
          <DimensionCard num="4" title="品牌監測" maxScore={20} color="#6b7f92" bgColor="#f1f5f9" pending />

          {/* 維度五：其他維度（建置中）*/}
          <DimensionCard num="5" title="其他維度" maxScore={20} color="#6b7f92" bgColor="#f1f5f9" pending />
        </div>
      </section>

      {/* 補充說明 */}
      <section className="bg-[var(--paper)] px-4 py-10 md:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--line)] bg-white p-6 md:p-8">
          <h2 className="mb-4 text-base font-bold text-[var(--ink)]">補充說明</h2>
          <ul className="space-y-3 text-sm leading-relaxed text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--blue)]">•</span>
              所有評分均以<strong className="text-[var(--ink2)]">診所為單位</strong>進行統計，而非醫師個人。
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--blue)]">•</span>
              Google 評分與司法資料每<strong className="text-[var(--ink2)]">月自動更新</strong>，以反映最新狀況。
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--blue)]">•</span>
              若您發現資料有誤或希望提出異議，請透過 LINE 官方帳號與我們聯繫，我們將在 5 個工作日內回覆。
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--blue)]">•</span>
              本平台<strong className="text-[var(--ink2)]">不接受診所付費提升評分</strong>，所有數值均由系統依規則自動計算。
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--blue)] px-4 py-12 text-center md:px-6 md:py-14">
        <div className="mx-auto max-w-xl">
          <h2
            className="mb-4 text-xl font-bold text-white md:text-2xl"
            style={{ fontFamily: "var(--font-noto-serif-tc)" }}
          >
            了解評分標準後，查看你想去的診所吧
          </h2>
          <Link
            href="/clinics"
            className="inline-block rounded-xl bg-white px-8 py-3 text-base font-bold text-[var(--blue)] no-underline shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-transform duration-150 hover:-translate-y-0.5"
          >
            查詢診所評分 →
          </Link>
        </div>
      </section>
    </main>
  );
}
