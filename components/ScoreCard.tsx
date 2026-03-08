import type { ClinicScores } from "@/data/clinics";

const DIM_CONFIG = [
  {
    key: "judicial" as const,
    label: "司法糾紛",
    desc: "法院判決書\n申訴案件追蹤",
    icon: "⚖️",
    color: "var(--red)",
  },
  {
    key: "google" as const,
    label: "Google 評分",
    desc: "即時評分\n評論數量分析",
    icon: "📍",
    color: "var(--blue)",
  },
  {
    key: "legal" as const,
    label: "合法登記",
    desc: "衛福部核查\n醫師執照驗證",
    icon: "🏛️",
    color: "var(--green)",
  },
  {
    key: "media" as const,
    label: "新聞媒體",
    desc: "媒體報導\nNLP 情緒分析",
    icon: "📰",
    color: "var(--amber)",
  },
  {
    key: "social" as const,
    label: "社群討論",
    desc: "PTT / Dcard\n口碑聲量分析",
    icon: "💬",
    color: "var(--cyan)",
  },
] as const;

/** 五維度可為 number 或 null（null 時顯示「資料收集中」） */
export type ScoreCardScores = {
  [K in keyof ClinicScores]: ClinicScores[K] | null;
};

export interface ScoreCardProps {
  /** 五維度分數（診所詳細頁用）；null 顯示「資料收集中」 */
  scores: ScoreCardScores;
  /** 是否顯示總分於上方，預設 true */
  showTotal?: boolean;
  /** 是否顯示每維度說明文字，預設 true */
  showDescription?: boolean;
  /** 外層是否包一層淺底（dims-bg 風格），預設 false */
  wrapInBackground?: boolean;
}

export default function ScoreCard({
  scores,
  showTotal = true,
  showDescription = true,
  wrapInBackground = false,
}: ScoreCardProps) {
  const content = (
    <div className="overflow-hidden rounded-[14px] border-[1.5px] border-[var(--line)] bg-white shadow-[0_2px_8px_rgba(0,0,0,.04)] grid grid-cols-5">
      {DIM_CONFIG.map(({ key, label, desc, icon, color }, i) => {
        const value = scores[key];
        const hasValue = value != null && typeof value === "number";
        return (
          <div
            key={key}
            className={`flex flex-col items-center py-5 px-4 text-center transition-colors duration-[0.18s] hover:bg-[var(--off)] ${i < 4 ? "border-r border-[var(--line)]" : ""}`}
          >
            <span className="mb-2 text-[22px]" aria-hidden>
              {icon}
            </span>
            <div
              className="mb-1 text-[20px] font-medium"
              style={{
                fontFamily: hasValue ? "var(--font-dm-mono)" : undefined,
                color: hasValue ? color : "var(--muted)",
              }}
            >
              {hasValue ? value.toFixed(1) : "資料收集中"}
            </div>
            <div className="mb-1 text-[12px] font-bold text-[var(--ink)]">
              {label}
            </div>
            {showDescription && (
              <div className="text-[10px] leading-snug text-[var(--muted)] whitespace-pre-line">
                {desc}
              </div>
            )}
            <div
              className="mt-2.5 h-[3px] w-12 max-w-[48px] rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
        );
      })}
    </div>
  );

  const total = scores.total;
  const hasTotal = total != null && typeof total === "number";

  return (
    <div>
      {showTotal && (
        <div className="mb-4 flex items-baseline gap-2">
          <span
            className="text-2xl font-medium text-[var(--blue)] md:text-3xl"
            style={{ fontFamily: "var(--font-dm-mono)" }}
          >
            {hasTotal ? total.toFixed(1) : "—"}
          </span>
          <span className="text-sm font-bold text-[var(--ink)]">綜合評分</span>
        </div>
      )}
      {wrapInBackground ? (
        <div className="border-y border-[var(--line)] bg-[var(--paper)] py-8">
          <div className="mx-auto max-w-[1060px] px-6">{content}</div>
        </div>
      ) : (
        content
      )}
    </div>
  );
}
