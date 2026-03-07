import Link from "next/link";
import { Suspense } from "react";
import SearchBox from "@/components/SearchBox";
import FilterBar from "@/components/FilterBar";
import TreatmentCard from "@/components/TreatmentCard";
import { treatments } from "@/data/treatments";
import type { Treatment } from "@/data/treatments";

const CATEGORY_MAP = {
  laser: { label: "雷射光療", sub: "淡斑 · 縮毛孔 · 除紋 · 美白", icon: "✨", gradient: "linear-gradient(160deg,#c8e6fa,#90caf9)" },
  injection: { label: "微整形注射", sub: "玻尿酸 · 肉毒 · 晶亮瓷", icon: "💉", gradient: "linear-gradient(160deg,#fce4ec,#f48fb1)" },
  surgery: { label: "外科手術", sub: "雙眼皮 · 隆鼻 · 拉皮", icon: "🔬", gradient: "linear-gradient(160deg,#f3e5f5,#ce93d8)" },
  skin: { label: "皮膚管理", sub: "保濕 · 痘疤 · 敏感修護", icon: "🌿", gradient: "linear-gradient(160deg,#e8f5e9,#a5d6a7)" },
} as const;

const VALID_CATEGORIES = ["laser", "injection", "surgery", "skin"] as const;
type CategoryKey = (typeof VALID_CATEGORIES)[number];

function getParamList(
  searchParams: { [key: string]: string | string[] | undefined },
  key: string
): string[] {
  const v = searchParams[key];
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function filterTreatments(
  list: Treatment[],
  category: string | undefined,
  priceRange: string | string[] | undefined
): Treatment[] {
  let out = list;
  if (category && VALID_CATEGORIES.includes(category as CategoryKey)) {
    out = out.filter((t) => t.category === category);
  }
  const price = priceRange == null ? "" : Array.isArray(priceRange) ? priceRange[0] : priceRange;
  if (price === "under1") {
    out = out.filter((t) => t.priceMax <= 10000);
  } else if (price === "1to3") {
    out = out.filter((t) => t.priceMin <= 30000 && t.priceMax >= 10000);
  } else if (price === "over3") {
    out = out.filter((t) => t.priceMin >= 30000);
  }
  return out;
}

const STEP2_FILTER_GROUPS = [
  {
    type: "multi" as const,
    param: "district",
    label: "",
    options: [
      { value: "all", label: "全台" },
      { value: "taipei", label: "台北市" },
      { value: "newtaipei", label: "新北市" },
      { value: "taoyuan", label: "桃園市" },
      { value: "taichung", label: "台中市" },
      { value: "tainan", label: "台南市" },
      { value: "kaohsiung", label: "高雄市" },
    ],
  },
  {
    type: "single" as const,
    param: "price",
    label: "價格",
    options: [
      { value: "", label: "不限" },
      { value: "under1", label: "1萬以下" },
      { value: "1to3", label: "1-3萬" },
      { value: "over3", label: "3萬以上" },
    ],
  },
];

export default async function TreatmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const priceRange = params.price;
  const filtered = filterTreatments(treatments, category, priceRange);
  const categoryLabel = category && category in CATEGORY_MAP ? CATEGORY_MAP[category as CategoryKey].label : "療程";
  const q = typeof params.q === "string" ? params.q : "";

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Hero + Search */}
      <div className="border-b border-[var(--line)] bg-white px-4 pb-8 pt-10 text-center md:px-6 md:pt-10 md:pb-8">
        <div className="relative z-10 mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,70,184,.1)] bg-[var(--blue-lt)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--blue)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--blue)]" />
          全台 200+ 種療程資料
        </div>
        <h2
          className="relative z-10 mb-2 text-2xl font-[900] tracking-tight text-[var(--ink)] md:text-3xl lg:text-4xl"
          style={{ fontFamily: "var(--font-noto-serif-tc)" }}
        >
          查<span className="text-[var(--blue)]">療程</span>
        </h2>
        <p className="relative z-10 mb-6 text-sm text-[var(--muted)]">
          先選療程類型・再選地區・找到提供這項療程的診所
        </p>
        <SearchBox
          variant="compact"
          icon="✨"
          placeholder="輸入療程名稱，例如：皮秒雷射…"
          searchPath="/treatments"
          defaultValue={q}
          buttonText="搜尋"
        />
      </div>

      {/* Step 1: 選擇療程類型 */}
      <div className="border-b border-[var(--line)] bg-white px-4 py-7 md:px-12 md:py-8">
        <div className="mx-auto max-w-[1060px]">
          <div className="mb-4 flex items-center gap-2.5">
            <div
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-[var(--blue)] text-[12px] font-medium text-white"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              1
            </div>
            <span className="text-[14px] font-bold text-[var(--ink)]">
              選擇療程類型
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-3.5">
            {(VALID_CATEGORIES as readonly string[]).map((cat) => {
              const info = CATEGORY_MAP[cat as CategoryKey];
              const isSelected = category === cat;
              return (
                <Link
                  key={cat}
                  href={isSelected ? "/treatments" : `/treatments?category=${cat}`}
                  className={`relative flex aspect-[4/3] overflow-hidden rounded-[14px] border-[2.5px] transition-all duration-[0.22s] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,.12)] ${
                    isSelected
                      ? "border-[var(--blue)] shadow-[0_0_0_3px_rgba(0,70,184,.15)]"
                      : "border-transparent"
                  }`}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center text-4xl md:text-[52px]"
                    style={{ background: info.gradient }}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: isSelected
                        ? "linear-gradient(to top, rgba(0,46,118,.82) 0%, rgba(0,70,184,.15) 100%)"
                        : "linear-gradient(to top, rgba(13,27,42,.72) 0%, transparent 55%)",
                    }}
                  />
                  {isSelected && (
                    <div className="absolute right-2.5 top-2.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[var(--blue)] text-[12px] text-white">
                      ✓
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div
                      className="text-[18px] font-bold text-white md:text-[18px]"
                      style={{ fontFamily: "var(--font-noto-serif-tc)" }}
                    >
                      {info.label}
                    </div>
                    <div className="text-[10px] text-white/65">
                      {info.sub}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step 2: 地區 + 價格（僅在已選類型時顯示） */}
      {category && (
        <div className="border-b border-[var(--line)] bg-white">
          <div className="mx-auto max-w-[1060px] px-4 pt-5 pb-2 md:px-8">
            <div className="mb-2.5 flex items-center gap-2.5">
              <div
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-[var(--blue)] text-[12px] font-medium text-white"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                2
              </div>
              <span className="text-[13px] font-bold text-[var(--ink)]">
                選擇地區（可複選）・價格
              </span>
            </div>
          </div>
          <Suspense fallback={<div className="h-14" />}>
            <FilterBar
              groups={STEP2_FILTER_GROUPS}
              stickyTop={168}
              showActiveTags={true}
            />
          </Suspense>
        </div>
      )}

      {/* Step 3: 療程列表（僅在已選類型時顯示） */}
      {category ? (
        <div className="mx-auto max-w-[1060px] px-4 py-6 md:px-8 md:py-8">
          <div className="mb-4 flex items-center gap-2">
            <div
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-[var(--blue)] text-[12px] font-medium text-white"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              3
            </div>
            <span className="text-[13px] font-bold text-[var(--ink)]">
              {categoryLabel} · 全台療程列表
            </span>
          </div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-[var(--muted)]">
              共 <strong className="font-bold text-[var(--ink)]">{filtered.length}</strong> 種療程
            </p>
            <div className="flex items-center gap-2 text-[13px] text-[var(--muted)]">
              <span>排序：</span>
              <select
                className="rounded-lg border-[1.5px] border-[var(--line2)] bg-white px-2.5 py-1.5 text-[12px] text-[var(--ink)] outline-none"
                aria-label="排序"
              >
                <option>熱門度</option>
                <option>價格低到高</option>
                <option>提供診所數多</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.length === 0 ? (
              <div className="col-span-full rounded-[14px] border border-[var(--line)] bg-white py-16 text-center text-[var(--muted)]">
                目前沒有符合條件的療程，試試放寬價格篩選。
              </div>
            ) : (
              filtered.map((t) => <TreatmentCard key={t.id} {...t} />)
            )}
          </div>
          {filtered.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-5 rounded-[14px] border border-[rgba(0,70,184,.12)] bg-[var(--blue-xl)] px-6 py-6">
              <div>
                <p className="text-[14px] font-bold text-[var(--ink)] mb-1">
                  找到想做的療程了嗎？
                </p>
                <p className="text-[12px] text-[var(--muted)] leading-snug">
                  加入 LINE，AI 顧問幫你比較提供該療程的診所，推薦最適合你的方案，完全免費。
                </p>
              </div>
              <a
                href="#line"
                className="shrink-0 rounded-[10px] bg-[var(--blue)] px-7 py-3 text-[14px] font-bold text-white no-underline transition-opacity hover:opacity-90"
              >
                📲 加 LINE 免費諮詢
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="mx-auto max-w-[1060px] px-4 py-12 text-center md:py-16">
          <p className="text-[var(--muted)]">
            請先在上方選擇療程類型，即可查看該類療程列表。
          </p>
        </div>
      )}

      <footer className="mt-auto border-t border-[var(--line)] bg-[var(--off)] px-6 py-5">
        <div className="mx-auto flex max-w-[1060px] flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-[var(--muted)]">
            © 360醫療AI大調查 · 評鑑分數由系統自動計算，不接受購買或修改
          </p>
          <span className="rounded-full bg-[var(--green-lt)] px-3 py-1 text-[10px] font-bold text-[var(--green)]">
            ✅ 系統運作中
          </span>
        </div>
      </footer>
    </div>
  );
}
