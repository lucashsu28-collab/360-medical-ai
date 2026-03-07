"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

/** 複選：同一 param 可多值，例如 ?district=taipei&district=newtaipei */
export interface FilterOptionMulti {
  type: "multi";
  param: string;
  label: string;
  options: { value: string; label: string }[];
}

/** 單選：同一 param 單一值，例如 ?scoreMin=9 */
export interface FilterOptionSingle {
  type: "single";
  param: string;
  label: string;
  options: { value: string; label: string }[];
}

/** 開關：啟用時 param=1，例如 ?showDispute=1 */
export interface FilterOptionToggle {
  type: "toggle";
  param: string;
  label: string;
  /** 開關開啟時顯示的文字，預設用 label */
  activeLabel?: string;
}

export type FilterGroup = FilterOptionMulti | FilterOptionSingle | FilterOptionToggle;

export interface FilterBarProps {
  groups: FilterGroup[];
  /** sticky 時的 top 值（px），預設 106，與 nav 高度配合 */
  stickyTop?: number;
  /** 是否顯示「已選：」與可移除的 tag 列 */
  showActiveTags?: boolean;
  /** 已選 tag 的標籤文字 */
  activeTagsLabel?: string;
}

function getParamValues(params: URLSearchParams, key: string): string[] {
  return params.getAll(key).filter(Boolean);
}

function setParamMulti(params: URLSearchParams, key: string, values: string[]) {
  params.delete(key);
  values.forEach((v) => params.append(key, v));
}

export default function FilterBar({
  groups,
  stickyTop = 106,
  showActiveTags = true,
  activeTagsLabel = "已選：",
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateUrl = useCallback(
    (next: URLSearchParams) => {
      const q = next.toString();
      router.push(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  const isMultiSelected = useCallback(
    (param: string, value: string) => {
      return getParamValues(searchParams, param).includes(value);
    },
    [searchParams]
  );

  const isSingleSelected = useCallback(
    (param: string, value: string) => {
      return searchParams.get(param) === value;
    },
    [searchParams]
  );

  const isToggleOn = useCallback(
    (param: string) => {
      return searchParams.get(param) === "1";
    },
    [searchParams]
  );

  const handleMultiClick = useCallback(
    (param: string, value: string) => {
      const next = new URLSearchParams(searchParams);
      const current = getParamValues(next, param);
      const nextValues = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setParamMulti(next, param, nextValues);
      updateUrl(next);
    },
    [searchParams, updateUrl]
  );

  const handleSingleClick = useCallback(
    (param: string, value: string) => {
      const next = new URLSearchParams(searchParams);
      const current = next.get(param);
      if (current === value) {
        next.delete(param);
      } else {
        next.set(param, value);
      }
      updateUrl(next);
    },
    [searchParams, updateUrl]
  );

  const handleToggleClick = useCallback(
    (param: string) => {
      const next = new URLSearchParams(searchParams);
      if (next.get(param) === "1") {
        next.delete(param);
      } else {
        next.set(param, "1");
      }
      updateUrl(next);
    },
    [searchParams, updateUrl]
  );

  const removeFilter = useCallback(
    (param: string, value?: string) => {
      const next = new URLSearchParams(searchParams);
      if (value !== undefined) {
        const current = getParamValues(next, param);
        setParamMulti(next, param, current.filter((v) => v !== value));
      } else {
        next.delete(param);
      }
      updateUrl(next);
    },
    [searchParams, updateUrl]
  );

  // 蒐集目前選中的 tag，用於「已選：」列
  const activeTags: { param: string; label: string; value?: string }[] = [];
  groups.forEach((g) => {
    if (g.type === "multi") {
      g.options.forEach((opt) => {
        if (isMultiSelected(g.param, opt.value)) {
          activeTags.push({ param: g.param, label: opt.label, value: opt.value });
        }
      });
    } else if (g.type === "single") {
      const v = searchParams.get(g.param);
      if (v) {
        const opt = g.options.find((o) => o.value === v);
        if (opt) activeTags.push({ param: g.param, label: opt.label, value: opt.value });
      }
    } else if (g.type === "toggle" && isToggleOn(g.param)) {
      activeTags.push({ param: g.param, label: g.activeLabel ?? g.label });
    }
  });

  return (
    <div
      className="sticky z-[90] border-b border-[var(--line)] bg-white px-4 py-3.5 md:px-12"
      style={{ top: stickyTop }}
    >
      <div className="mx-auto max-w-[1060px]">
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
          {groups.map((group, idx) => (
            <span key={group.param + idx} className="contents">
              {idx > 0 && (
                <span
                  className="h-5 w-px flex-shrink-0 bg-[var(--line2)]"
                  aria-hidden
                />
              )}
              {group.type === "multi" && (
                <>
                  <span className="flex-shrink-0 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
                    {group.label}
                  </span>
                  {group.options.map((opt) => {
                    const on = isMultiSelected(group.param, opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleMultiClick(group.param, opt.value)}
                        className={`flex flex-shrink-0 items-center gap-1 rounded-full border-[1.5px] px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-[0.18s] whitespace-nowrap ${
                          on
                            ? "border-[var(--blue)] bg-[var(--blue-lt)] text-[var(--blue)]"
                            : "border-[var(--line2)] bg-white text-[var(--ink2)] hover:border-[var(--blue)] hover:text-[var(--blue)]"
                        }`}
                      >
                        {opt.label}
                        {on && " ✓"}
                      </button>
                    );
                  })}
                </>
              )}
              {group.type === "single" && (
                <>
                  <span className="flex-shrink-0 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
                    {group.label}
                  </span>
                  {group.options.map((opt) => {
                    const on = isSingleSelected(group.param, opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSingleClick(group.param, opt.value)}
                        className={`flex flex-shrink-0 items-center gap-1 rounded-full border-[1.5px] px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-[0.18s] whitespace-nowrap ${
                          on
                            ? "border-[var(--blue)] bg-[var(--blue)] text-white"
                            : "border-[var(--line2)] bg-white text-[var(--ink2)] hover:border-[var(--blue)] hover:text-[var(--blue)]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </>
              )}
              {group.type === "toggle" && (
                <button
                  type="button"
                  onClick={() => handleToggleClick(group.param)}
                  className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-[0.18s] whitespace-nowrap ${
                    isToggleOn(group.param)
                      ? "border-[rgba(192,57,43,.3)] bg-[var(--red-lt)] text-[var(--red)]"
                      : "border-[var(--line2)] bg-white text-[var(--muted)] hover:border-[var(--blue)] hover:text-[var(--blue)]"
                  }`}
                >
                  {isToggleOn(group.param)
                    ? group.activeLabel ?? group.label
                    : group.label}
                </button>
              )}
            </span>
          ))}
        </div>

        {showActiveTags && activeTags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[var(--muted)] whitespace-nowrap">
              {activeTagsLabel}
            </span>
            {activeTags.map((t) => (
              <button
                key={`${t.param}-${t.value ?? "on"}`}
                type="button"
                onClick={() => removeFilter(t.param, t.value)}
                className="inline-flex items-center gap-1 rounded-full border border-[rgba(0,70,184,.15)] bg-[var(--blue-lt)] px-2.5 py-1 text-[11px] font-bold text-[var(--blue)] transition-all duration-[0.18s] hover:border-[rgba(192,57,43,.2)] hover:bg-[var(--red-lt)] hover:text-[var(--red)]"
              >
                {t.label} ×
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
