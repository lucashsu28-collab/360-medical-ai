"use client";

export default function AnalyticsPage() {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>網站數據分析與排名</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>GA4 流量分析、診所查詢排行、LINE 轉換漏斗（Phase 2 串接 GA4）</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[
          { icon: "📈", title: "GA4 流量分析", desc: "頁面瀏覽數、獨立訪客、跳出率、用戶來源" },
          { icon: "🏆", title: "診所查詢排行 TOP 20", desc: "最多人查詢的診所排行，市場熱度指標" },
          { icon: "🔍", title: "熱門療程搜尋關鍵字", desc: "用戶搜尋頻率最高的療程關鍵字排行" },
          { icon: "📱", title: "LINE 轉換漏斗", desc: "診所頁 → 加 LINE → 解鎖報告 轉換率分析" },
          { icon: "🗺️", title: "用戶地區分布", desc: "訪客來源縣市分布圖" },
        ].map(item => (
          <div key={item.title} style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ fontSize: 32 }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 4px" }}>{item.title}</h3>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>{item.desc}</p>
            </div>
            <span style={{ background: "#EEEDFE", color: "#534AB7", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>Phase 2</span>
          </div>
        ))}
      </div>
    </div>
  );
}
