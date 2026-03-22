import { Suspense } from "react";
import SearchBox from "@/components/SearchBox";
import FilterBar from "@/components/FilterBar";
import ClinicCard from "@/components/ClinicCard";

/** 後端 API 回傳的診所格式 */
export interface ApiClinic {
  id: string;
  name: string;
  address: string;
  phone?: string;
  specialty?: string;
  score?: number | null;
  google_rating?: number | null;
  google_review_count?: number | null;
  isPartner?: boolean;
  [key: string]: unknown;
}

const CITY_MAP: Record<string, string> = {
  taipei: "台北市",
  newtaipei: "新北市",
  taoyuan: "桃園市",
  taichung: "台中市",
  tainan: "台南市",
  kaohsiung: "高雄市",
};

const TYPE_KEYWORDS: Record<string, string[]> = {
  laser: ["雷射", "皮秒", "飛梭", "淨膚", "電波", "除毛", "光子", "染料", "IPL"],
  injection: ["玻尿酸", "肉毒", "晶亮瓷", "童顏針", "埋線"],
  surgery: ["雙眼皮", "隆鼻", "拉皮", "抽脂", "隆乳", "眼袋", "鼻整形", "眼整形", "腹部整形", "全臉拉皮"],
  skin: ["保濕", "痘疤", "淡斑", "皮膚", "美白", "敏感", "酒糟", "保濕療程", "皮膚管理"],
};

function getParamList(
  searchParams: { [key: string]: string | string[] | undefined },
  key: string
): string[] {
  const v = searchParams[key];
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function filterClinics(
  list: ApiClinic[],
  searchParams: { [key: string]: string | string[] | undefined }
): ApiClinic[] {
  const districts = getParamList(searchParams, "district");
  const types = getParamList(searchParams, "type");
  const scoreMin = searchParams.scoreMin;
  const partnerOnly = getParamList(searchParams, "partnerOnly").includes("1");

  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  return list.filter((c) => {
    if (q && !(c.name || "").includes(q)) return false;
    if (districts.length > 0) {
      const cities = districts.map((d) => CITY_MAP[d]).filter(Boolean);
      if (cities.length > 0 && !cities.some((city) => (c.address || "").startsWith(city)))
        return false;
    }
    if (types.length > 0) {
      const keywords = types.flatMap((t) => TYPE_KEYWORDS[t] ?? []);
      const specialtyStr = c.specialty || "";
      const match = keywords.some((kw) => specialtyStr.includes(kw));
      if (!match) return false;
    }
    if (scoreMin != null) {
      const min = parseFloat(String(scoreMin));
      const s = c.score ?? 0;
      if (!Number.isNaN(min) && s < min) return false;
    }
    if (partnerOnly && !c.isPartner) return false;
    return true;
  });
}

const FILTER_GROUPS = [
  {
    type: "multi" as const,
    param: "district",
    label: "地區",
    options: [
      { value: "taipei", label: "台北市" },
      { value: "newtaipei", label: "新北市" },
      { value: "taoyuan", label: "桃園市" },
      { value: "taichung", label: "台中市" },
      { value: "tainan", label: "台南市" },
      { value: "kaohsiung", label: "高雄市" },
    ],
  },
  {
    type: "multi" as const,
    param: "type",
    label: "療程",
    options: [
      { value: "laser", label: "雷射光療" },
      { value: "injection", label: "微整形" },
      { value: "surgery", label: "外科手術" },
      { value: "skin", label: "皮膚管理" },
    ],
  },
  {
    type: "single" as const,
    param: "scoreMin",
    label: "評分",
    options: [
      { value: "9", label: "9分以上" },
      { value: "8", label: "8分以上" },
      { value: "7.5", label: "7.5分以上" },
    ],
  },
  {
    type: "multi" as const,
    param: "partnerOnly",
    label: "",
    options: [{ value: "1", label: "只看合作診所" }],
  },
];

export default async function ClinicsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const res = await fetch(`${apiUrl}/api/clinics?limit=904`, { next: { revalidate: 3600 } });
  const { clinics } = (await res.json()) as { clinics: ApiClinic[] };
  const list = Array.isArray(clinics) ? clinics : [];

  const params = await searchParams;
  const filtered = filterClinics(list, params);
  const q = typeof params.q === "string" ? params.q : "";

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Hero + Search */}
      <div className="border-b border-[var(--line)] bg-white px-4 pb-8 pt-10 text-center md:px-6 md:pt-10 md:pb-8">
        <div className="relative z-10 mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,70,184,.1)] bg-[var(--blue-lt)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--blue)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--blue)]" />
          全台 {list.length} 家診所
        </div>
        <h2
          className="relative z-10 mb-2 text-2xl font-[900] tracking-tight text-[var(--ink)] md:text-3xl lg:text-4xl"
          style={{ fontFamily: "var(--font-noto-serif-tc)" }}
        >
          查<span className="text-[var(--blue)]">診所</span>
        </h2>
        <p className="relative z-10 mb-6 text-sm text-[var(--muted)]">
          選地區・選療程・看五維度評鑑分數
        </p>
        <SearchBox
          variant="compact"
          icon="🏥"
          placeholder="輸入診所名稱…"
          searchPath="/clinics"
          defaultValue={q}
          buttonText="搜尋"
        />
      </div>

      {/* FilterBar (client, needs Suspense for useSearchParams) */}
      <Suspense fallback={<div className="h-14 border-b border-[var(--line)] bg-white" />}>
        <FilterBar groups={FILTER_GROUPS} stickyTop={106} />
      </Suspense>

      {/* Results */}
      <div className="mx-auto max-w-[1060px] px-4 py-6 md:px-8 md:py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-[var(--muted)]">
            共找到 <strong className="font-bold text-[var(--ink)]">{filtered.length}</strong> 家診所
          </p>
          <div className="flex items-center gap-2 text-[13px] text-[var(--muted)]">
            <span>排序：</span>
            <select
              className="rounded-lg border-[1.5px] border-[var(--line2)] bg-white px-2.5 py-1.5 text-[12px] text-[var(--ink)] outline-none"
              aria-label="排序"
            >
              <option>評分最高</option>
              <option>評論最多</option>
              <option>最近更新</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {filtered.length === 0 ? (
            <div className="rounded-[14px] border border-[var(--line)] bg-white py-16 text-center text-[var(--muted)]">
              目前沒有符合條件的診所，試試放寬篩選條件。
            </div>
          ) : (
            filtered.map((clinic) => (
              <ClinicCard
                key={clinic.id}
                id={clinic.id}
                name={clinic.name}
                address={clinic.address}
                score={clinic.score ?? undefined}
                specialty={clinic.specialty}
                google_rating={clinic.google_rating ?? undefined}
                review_count={clinic.google_review_count ?? undefined}
                variant="row"
              />
            ))
          )}
        </div>
      </div>

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
