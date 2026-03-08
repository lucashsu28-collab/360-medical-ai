"use client";

import type { LineEntry } from "./FogReport";

const LINE_ADD_URL = "https://lin.ee/6sTCRzm";

export default function AddLineButton({
  lineEntry,
  label = "加 LINE",
}: {
  lineEntry: LineEntry;
  label?: string;
}) {
  const handleClick = () => {
    localStorage.setItem(
      "lineEntry",
      JSON.stringify({
        type: lineEntry.type,
        id: lineEntry.id,
        name: lineEntry.name,
      })
    );
    window.open(LINE_ADD_URL, "_blank");
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className="font-bold text-[var(--blue)] hover:underline"
    >
      {label}
    </button>
  );
}
