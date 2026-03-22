"use client";

export default function AiTrainingPage() {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>AI 顧問訓練/調教</h1>
      <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>查看對話記錄、標記好壞回答、管理 FAQ 知識庫（Phase 2 串接 AIMS）</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[
          { icon: "💬", title: "對話記錄查看", desc: "查看所有 LINE 用戶與 AI 顧問的對話歷史，依用戶/時間篩選" },
          { icon: "👍", title: "好壞回答標記", desc: "標記 AI 回答品質，系統自動統計哪類問題答不好" },
          { icon: "📚", title: "FAQ 知識庫管理", desc: "新增、編輯、刪除常見問題與標準回答" },
          { icon: "🧪", title: "測試模式", desc: "直接與 AI 顧問對話，測試回答品質" },
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
