import { Suspense } from "react";
import SearchBox from "@/components/SearchBox";
import FilterBar from "@/components/FilterBar";
import DoctorCard from "@/components/DoctorCard";
import { doctors } from "@/data/doctors";
import type { Doctor } from "@/data/doctors";

const CITY_MAP: Record<string, string> = {
  taipei: "台北市",
  newtaipei: "新北市",
  taoyuan: "桃園市",
  taichung: "台中市",
  tainan: "台南市",
  kaohsiung: "高雄市",
};

/** 專長 param value -> doctor.specialty 比對用 */
const SPEC_MAP: Record<string, string> = {
  laser: "雷射",
  injection: "微整形",
  surgery: "整形外科",
  skin: "皮膚科",
};

/** 專科資格 param value -> title 關鍵字 */
const CERT_MAP: Record<string, string> = {
  plastic: "整形外科專科",
  dermatology: "皮膚科專科",
  general: "一般外科",
};

function getParamList(
  searchParams: { [key: string]: string | string[] | undefined },
  key: string
): string[] {
  const v = searchParams[key];
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function filterDoctors(
  list: Doctor[],
  searchParams: { [key: string]: string | string[] | undefined }
): Doctor[] {
  const districts = getParamList(searchParams, "district");
  const specs = getParamList(searchParams, "spec");
  const cert = searchParams.cert;
  const showDispute = searchParams.showDispute === "1";

  return list.filter((d) => {
    if (districts.length > 0) {
      const cities = districts.map((x) => CITY_MAP[x]).filter(Boolean);
      if (cities.length > 0 && !cities.includes(d.district)) return false;
    }
    if (specs.length > 0) {
      const specialties = specs.map((s) => SPEC_MAP[s]).filter(Boolean);
      if (specialties.length > 0 && !specialties.includes(d.specialty))
        return false;
    }
    if (cert != null && String(cert)) {
      const keyword = CERT_MAP[String(cert)];
      if (keyword && !d.title.includes(keyword)) return false;
    }
    if (showDispute && d.disputeCount === 0) return false;
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
    param: "spec",
    label: "專長",
    options: [
      { value: "laser", label: "雷射" },
      { value: "injection", label: "微整形" },
      { value: "surgery", label: "整形外科" },
      { value: "skin", label: "皮膚科" },
    ],
  },
  {
    type: "single" as const,
    param: "cert",
    label: "專科資格",
    options: [
      { value: "plastic", label: "整形外科專科" },
      { value: "dermatology", label: "皮膚科專科" },
      { value: "general", label: "一般外科" },
    ],
  },
  {
    type: "toggle" as const,
    param: "showDispute",
    label: "⚠️ 顯示有糾紛紀錄醫師",
  },
];

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filtered = filterDoctors(doctors, params);
  const q = typeof params.q === "string" ? params.q : "";

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Hero + Search */}
      <div className="border-b border-[var(--line)] bg-white px-4 pb-8 pt-10 text-center md:px-6 md:pt-10 md:pb-8">
        <div className="relative z-10 mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,70,184,.1)] bg-[var(--blue-lt)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--blue)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--blue)]" />
          全台 {doctors.length}+ 位醫師
        </div>
        <h2
          className="relative z-10 mb-2 text-2xl font-[900] tracking-tight text-[var(--ink)] md:text-3xl lg:text-4xl"
          style={{ fontFamily: "var(--font-noto-serif-tc)" }}
        >
          查<span className="text-[var(--blue)]">醫師</span>
        </h2>
        <p className="relative z-10 mb-6 text-sm text-[var(--muted)]">
          查執照・查糾紛・看現職診所評鑑分數
        </p>
        <SearchBox
          variant="compact"
          icon="👨‍⚕️"
          placeholder="輸入醫師姓名…"
          searchPath="/doctors"
          defaultValue={q}
          buttonText="搜尋"
        />
      </div>

      <Suspense fallback={<div className="h-14 border-b border-[var(--line)] bg-white" />}>
        <FilterBar groups={FILTER_GROUPS} stickyTop={106} />
      </Suspense>

      <div className="mx-auto max-w-[1060px] px-4 py-6 md:px-8 md:py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-[var(--muted)]">
            共找到 <strong className="font-bold text-[var(--ink)]">{filtered.length}</strong> 位醫師
          </p>
          <div className="flex items-center gap-2 text-[13px] text-[var(--muted)]">
            <span>排序：</span>
            <select
              className="rounded-lg border-[1.5px] border-[var(--line2)] bg-white px-2.5 py-1.5 text-[12px] text-[var(--ink)] outline-none"
              aria-label="排序"
            >
              <option>所屬診所評分最高</option>
              <option>執業年資最長</option>
              <option>糾紛最少</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {filtered.length === 0 ? (
            <div className="rounded-[14px] border border-[var(--line)] bg-white py-16 text-center text-[var(--muted)]">
              目前沒有符合條件的醫師，試試放寬篩選條件。
            </div>
          ) : (
            filtered.map((doctor) => (
              <DoctorCard key={doctor.id} {...doctor} />
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
