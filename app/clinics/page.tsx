import { Suspense } from "react";
import SearchBox from "@/components/SearchBox";
import FilterBar from "@/components/FilterBar";
import ClinicCard from "@/components/ClinicCard";

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
  is_partner?: boolean;
  line_oa_url?: string;
  [key: string]: unknown;
}

// ── 22 縣市定義 ────────────────────────────────────────────────────────────────
const TAIWAN_CITIES: { canonical: string; variants: string[] }[] = [
  { canonical: "台北市", variants: ["台北市", "臺北市"] },
  { canonical: "新北市", variants: ["新北市"] },
  { canonical: "基隆市", variants: ["基隆市"] },
  { canonical: "桃園市", variants: ["桃園市"] },
  { canonical: "新竹市", variants: ["新竹市"] },
  { canonical: "新竹縣", variants: ["新竹縣"] },
  { canonical: "苗栗縣", variants: ["苗栗縣"] },
  { canonical: "台中市", variants: ["台中市", "臺中市"] },
  { canonical: "彰化縣", variants: ["彰化縣"] },
  { canonical: "南投縣", variants: ["南投縣"] },
  { canonical: "雲林縣", variants: ["雲林縣"] },
  { canonical: "嘉義市", variants: ["嘉義市"] },
  { canonical: "嘉義縣", variants: ["嘉義縣"] },
  { canonical: "台南市", variants: ["台南市", "臺南市"] },
  { canonical: "高雄市", variants: ["高雄市"] },
  { canonical: "屏東縣", variants: ["屏東縣"] },
  { canonical: "宜蘭縣", variants: ["宜蘭縣"] },
  { canonical: "花蓮縣", variants: ["花蓮縣"] },
  { canonical: "台東縣", variants: ["台東縣", "臺東縣"] },
  { canonical: "澎湖縣", variants: ["澎湖縣"] },
  { canonical: "金門縣", variants: ["金門縣"] },
  { canonical: "連江縣", variants: ["連江縣"] },
];

// ── 篩選定義 ───────────────────────────────────────────────────────────────────
const CITY_MAP: Record<string, string[]> = {
  taipei:    ["臺北市", "台北市"],
  newtaipei: ["新北市"],
  taoyuan:   ["桃園市"],
  taichung:  ["臺中市", "台中市"],
  tainan:    ["臺南市", "台南市"],
  kaohsiung: ["高雄市"],
};

const TYPE_KEYWORDS: Record<string, string[]> = {
  laser: ["雷射", "皮秒", "飛梭", "淨膚", "電波", "除毛", "光子", "染料", "IPL"],
  injection: ["玻尿酸", "肉毒", "晶亮瓷", "童顏針", "埋線"],
  surgery: ["雙眼皮", "隆鼻", "拉皮", "抽脂", "隆乳", "眼袋", "鼻整形", "眼整形"],
  skin: ["保濕", "痘疤", "淡斑", "皮膚", "美白", "敏感", "酒糟"],
};

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

// ── helpers ───────────────────────────────────────────────────────────────────
function getParamList(
  searchParams: { [key: string]: string | string[] | undefined },
  key: string
): string[] {
  const v = searchParams[key];
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

const cleanStr = (s: string) => s.replace(/[.\s·・\-_]/g, "");

function filterClinics(
  list: ApiClinic[],
  searchParams: { [key: string]: string | string[] | undefined }
): ApiClinic[] {
  const districts = getParamList(searchParams, "district");
  const types = getParamList(searchParams, "type");
  const scoreMin = searchParams.scoreMin;
  const partnerOnly = getParamList(searchParams, "partnerOnly").includes("1");
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const cleanQ = cleanStr(q);

  return list.filter((c) => {
    if (q && !cleanStr(c.name || "").includes(cleanQ)) return false;
    if (districts.length > 0) {
      const cities = districts.flatMap((d) => CITY_MAP[d] ?? []);
      if (cities.length > 0 && !cities.some((city) => (c.address || "").startsWith(city)))
        return false;
    }
    if (types.length > 0) {
      const keywords = types.flatMap((t) => TYPE_KEYWORDS[t] ?? []);
      const specialtyStr = c.specialty || "";
      if (!keywords.some((kw) => specialtyStr.includes(kw))) return false;
    }
    if (scoreMin != null) {
      const min = parseFloat(String(scoreMin));
      if (!Number.isNaN(min) && (c.score ?? 0) < min) return false;
    }
    if (partnerOnly && !c.isPartner && !c.is_partner) return false;
    return true;
  });
}

function getCityGroups(clinics: ApiClinic[]): Map<string, ApiClinic[]> {
  const groups = new Map<string, ApiClinic[]>();
  for (const { canonical } of TAIWAN_CITIES) groups.set(canonical, []);
  groups.set("其他", []);

  for (const clinic of clinics) {
    const addr = clinic.address || "";
    let assigned = false;
    for (const { canonical, variants } of TAIWAN_CITIES) {
      if (variants.some((v) => addr.startsWith(v))) {
        groups.get(canonical)!.push(clinic);
        assigned = true;
        break;
      }
    }
    if (!assigned) groups.get("其他")!.push(clinic);
  }

  // 每縣市：合作診所優先，其次依評分
  for (const [, arr] of groups) {
    arr.sort((a, b) => {
      const ap = a.isPartner || a.is_partner ? 1 : 0;
      const bp = b.isPartner || b.is_partner ? 1 : 0;
      if (bp !== ap) return bp - ap;
      return (b.score ?? 0) - (a.score ?? 0);
    });
  }
  return groups;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ClinicsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const res = await fetch(`${apiUrl}/api/clinics?limit=9999`, { next: { revalidate: 3600 } });
  const { clinics } = (await res.json()) as { clinics: ApiClinic[] };
  const list = Array.isArray(clinics) ? clinics : [];

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const hasFilters = !!(
    q ||
    params.district ||
    params.type ||
    params.scoreMin ||
    getParamList(params, "partnerOnly").includes("1")
  );

  const filtered = filterClinics(list, params);

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Hero + Search */}
      <div className="border-b border-[var(--line)] bg-white px-4 pb-8 pt-10 text-center md:px-6">
        <div className="relative z-10 mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,70,184,.1)] bg-[var(--blue-lt)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--blue)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--blue)]" />
          全台 {list.length} 家診所
        </div>
        <h2
          className="relative z-10 mb-2 text-2xl font-[900] tracking-tight text-[var(--ink)] md:text-3xl lg:text-4xl"
          style={{ fontFamily: "var(--font-noto-serif-tc)" }}
        >
          全台<span className="text-[var(--blue)]">診所</span>資料館
        </h2>
        <p className="relative z-10 mb-6 text-sm text-[var(--muted)]">
          選地區・選療程・看六維度評鑑分數
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

      {/* FilterBar */}
      <Suspense fallback={<div className="h-14 border-b border-[var(--line)] bg-white" />}>
        <FilterBar groups={FILTER_GROUPS} stickyTop={106} />
      </Suspense>

      {/* Content */}
      <div className="mx-auto max-w-[1060px] px-4 py-6 md:px-8 md:py-8">
        {hasFilters ? (
          /* 搜尋 / 篩選結果 — 平鋪列表 */
          <>
            <p className="mb-4 text-[13px] text-[var(--muted)]">
              共找到 <strong className="font-bold text-[var(--ink)]">{filtered.length}</strong> 家診所
            </p>
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
                    isPartner={clinic.isPartner || clinic.is_partner}
                    variant="row"
                  />
                ))
              )}
            </div>
          </>
        ) : (
          /* 預設 — 22縣市分組 */
          <div className="space-y-10">
            {Array.from(getCityGroups(list).entries())
              .filter(([, clinicsArr]) => clinicsArr.length > 0)
              .map(([city, clinicsArr]) => (
                <section key={city}>
                  <div className="mb-3 flex items-center gap-3">
                    <h2 className="text-[16px] font-bold text-[var(--ink)]">{city}</h2>
                    <span className="rounded-full bg-[var(--blue-lt)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--blue)]">
                      {clinicsArr.length} 家
                    </span>
                    {clinicsArr.some((c) => c.isPartner || c.is_partner) && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-600">
                        ✦ 有合作診所
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {clinicsArr.slice(0, 10).map((clinic) => (
                      <ClinicCard
                        key={clinic.id}
                        id={clinic.id}
                        name={clinic.name}
                        address={clinic.address}
                        score={clinic.score ?? undefined}
                        specialty={clinic.specialty}
                        google_rating={clinic.google_rating ?? undefined}
                        review_count={clinic.google_review_count ?? undefined}
                        isPartner={clinic.isPartner || clinic.is_partner}
                        variant="row"
                      />
                    ))}
                    {clinicsArr.length > 10 && (
                      <a
                        href={`/clinics?district=${encodeURIComponent(
                          city === "台北市" ? "taipei"
                          : city === "新北市" ? "newtaipei"
                          : city === "桃園市" ? "taoyuan"
                          : city === "台中市" ? "taichung"
                          : city === "台南市" ? "tainan"
                          : city === "高雄市" ? "kaohsiung"
                          : ""
                        )}`}
                        className="mt-1 block rounded-[10px] border border-dashed border-[var(--line)] py-3 text-center text-[13px] text-[var(--blue)] transition hover:border-[var(--blue)] hover:bg-[var(--blue-lt)]"
                      >
                        查看 {city} 全部 {clinicsArr.length} 家 →
                      </a>
                    )}
                  </div>
                </section>
              ))}
          </div>
        )}
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
