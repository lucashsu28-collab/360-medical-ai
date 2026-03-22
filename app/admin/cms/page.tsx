"use client";
import { useState } from "react";

export default function CmsPage() {
  const [tab, setTab] = useState<"banner"|"announcement"|"seo">("banner");

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>內容管理 CMS</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 20 }}>管理首頁 Banner、公告、SEO 文案（LINE 推播排程於 Phase 2 開放）</p>

      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid #E2E8F0" }}>
        {([["banner","Banner 管理"],["announcement","網站公告"],["seo","SEO 文案"]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "10px 24px", background: "transparent", border: "none", borderBottom: `2px solid ${tab === t ? "#3B82F6" : "transparent"}`, color: tab === t ? "#3B82F6" : "#64748B", fontSize: 14, fontWeight: tab === t ? 600 : 400, cursor: "pointer", marginBottom: -2 }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        {tab === "banner" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", margin: 0 }}>首頁 Banner 列表</h3>
              <button style={{ padding: "7px 16px", background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ 新增 Banner</button>
            </div>
            <p style={{ color: "#94A3B8", fontSize: 13 }}>目前無 Banner 資料（Phase 2 串接後台 DB）</p>
          </div>
        )}
        {tab === "announcement" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", margin: 0 }}>網站公告管理</h3>
              <button style={{ padding: "7px 16px", background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ 新增公告</button>
            </div>
            <p style={{ color: "#94A3B8", fontSize: 13 }}>目前無公告資料（Phase 2 串接後台 DB）</p>
          </div>
        )}
        {tab === "seo" && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 8 }}>SEO 文案管理</h3>
            <p style={{ color: "#64748B", fontSize: 13, marginBottom: 12 }}>接收 AIMS AI SEO 系統推送的診所文章，管理各診所頁面 SEO 內容。</p>
            <p style={{ color: "#94A3B8", fontSize: 13 }}>Phase 2 串接 AIMS AI SEO 系統後開放。</p>
          </div>
        )}
      </div>
    </div>
  );
}
