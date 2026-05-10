"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

export type SearchBoxVariant = "hero" | "compact";

export interface SearchBoxProps {
  /** 大型首頁用 或 列表頁緊湊用 */
  variant?: SearchBoxVariant;
  /** 搜尋框左側圖示（emoji 或文字） */
  icon?: string;
  placeholder?: string;
  /** 按鈕文字，預設 hero 為「查詢」、compact 為「搜尋」 */
  buttonText?: string;
  /** 送出時導向此路徑並帶上 ?q=，例如 "/clinics"；不傳則僅觸發 onSearch */
  searchPath?: string;
  /** 送出時回調（可與 searchPath 並用） */
  onSearch?: (query: string) => void;
  /** 表單預設值（非受控） */
  defaultValue?: string;
  /** 無障礙標籤 */
  "aria-label"?: string;
}

const variantStyles = {
  hero: {
    wrap: "max-w-[640px] mx-auto mb-4",
    box: "rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,.1)] focus-within:border-[var(--blue)] focus-within:shadow-[0_8px_32px_rgba(0,70,184,.15)]",
    icon: "pl-5 pr-4 text-[20px]",
    input: "py-[18px] text-base",
    btn: "m-2 rounded-[9px] px-7 py-3 text-[15px]",
  },
  compact: {
    wrap: "max-w-[560px] mx-auto",
    box: "rounded-[12px] shadow-[0_6px_24px_rgba(0,0,0,.09)] focus-within:border-[var(--blue)] focus-within:shadow-[0_6px_24px_rgba(0,70,184,.14)]",
    icon: "pl-[18px] pr-[14px] text-[18px]",
    input: "py-[14px] text-[15px]",
    btn: "m-[7px] rounded-[8px] px-[22px] py-2.5 text-[14px]",
  },
} as const;

export default function SearchBox({
  variant = "hero",
  icon = "🔍",
  placeholder = "輸入診所名稱、醫師姓名、或療程…",
  buttonText,
  searchPath,
  onSearch,
  defaultValue = "",
  "aria-label": ariaLabel = "搜尋",
}: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const styles = variantStyles[variant];
  const label = buttonText ?? (variant === "hero" ? "查詢" : "搜尋");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = inputRef.current?.value.trim() ?? "";
    onSearch?.(value);
    if (searchPath && value) {
      const params = new URLSearchParams({ q: value });
      router.push(`${searchPath}?${params.toString()}`);
    }
  }

  return (
    <div className={`relative z-10 ${styles.wrap}`}>
      <form
        action={searchPath || undefined}
        method="get"
        onSubmit={handleSubmit}
        className={`flex items-center overflow-hidden rounded-xl border-2 border-[var(--line2)] bg-white transition-[border-color,box-shadow] duration-200 ${styles.box}`}
        role="search"
        aria-label={ariaLabel}
      >
        <span
          className={`flex-shrink-0 text-[var(--muted)] ${styles.icon}`}
          aria-hidden
        >
          {icon}
        </span>
        <input
          ref={inputRef}
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={`min-w-0 flex-1 border-0 bg-transparent font-[family-name:var(--font-noto-sans-tc)] text-[var(--ink)] outline-none placeholder:text-[var(--light)] ${styles.input}`}
          style={{ fontFamily: "var(--font-noto-sans-tc)" }}
          autoComplete="off"
          enterKeyHint="search"
          aria-label="搜尋關鍵字"
        />
        <button
          type="submit"
          className={`flex-shrink-0 whitespace-nowrap bg-[var(--blue)] font-bold text-white transition-colors duration-200 hover:bg-[var(--blue2)] ${styles.btn}`}
        >
          {label}
        </button>
      </form>
    </div>
  );
}
