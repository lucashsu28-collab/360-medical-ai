"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { getPortalToken } from "@/app/portal/utils";

interface Feature { title: string; desc: string; }
interface SignatureTreatment { title: string; tagline?: string; desc?: string; price?: string; badge?: string; image?: string; }
interface Director { name?: string; title?: string; years?: number | string; desc?: string; photo?: string; }
interface BeforeAfter { treatment: string; duration?: string; note?: string; face?: string; }
interface DoctorPick { title: string; target?: string; items?: string[]; doctor_note?: string; price_from?: string; image?: string; }
interface TreatmentFull { name: string; price?: string; desc?: string; image?: string; }
interface Testimonial { name: string; initial?: string; text: string; rating?: number; treatment?: string; }
interface MediaReport { outlet: string; title: string; date?: string; tier?: string; url?: string; }

interface BrandPage {
  hero_image_url?: string | null;
  slogan?: string | null;
  subtitle?: string | null;
  features?: Feature[];
  signature_treatments?: SignatureTreatment[];
  director?: Director | null;
  before_after?: BeforeAfter[];
  doctor_picks?: DoctorPick[];
  treatments_full?: TreatmentFull[];
  testimonials?: Testimonial[];
  media_reports?: MediaReport[];
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function PortalBrandPage() {
  const params = useParams();
  const clinicId = params?.clinic_id as string;
  const [data, setData] = useState<BrandPage>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const token = getPortalToken();
    fetch(`${API}/api/portal/${clinicId}/brand`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setData)
      .catch(() => setData({}))
      .finally(() => setLoading(false));
  }, [clinicId]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    const token = getPortalToken();
    const r = await fetch(`${API}/api/portal/${clinicId}/brand`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (r.ok) {
      setSavedAt(new Date().toLocaleTimeString("zh-TW"));
    } else {
      alert("儲存失敗，請重試");
    }
  }

  function update<K extends keyof BrandPage>(key: K, value: BrandPage[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  if (loading) return <p style={{ color: "#94A3B8", fontSize: 13 }}>載入中…</p>;

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>✦ 品牌頁面編輯</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {savedAt && <span style={{ fontSize: 11, color: "#64748B" }}>已儲存 {savedAt}</span>}
          <a href={`/clinics/${clinicId}`} target="_blank" rel="noopener noreferrer"
            style={{ padding: "6px 12px", background: "#EFF6FF", color: "#3B82F6", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
            預覽前台 →
          </a>
          <button onClick={save} disabled={saving}
            style={{ padding: "8px 18px", background: saving ? "#A0AEC0" : "#0F172A", color: "#FBBF24", border: 0, borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "儲存中…" : "💾 儲存全部"}
          </button>
        </div>
      </div>
      <p style={{ color: "#64748B", fontSize: 13, marginBottom: 24 }}>
        編輯合作診所品牌頁面內容。儲存後 1-2 分鐘前台會更新（CDN 快取）。
      </p>

      <Section title="① Hero 主視覺">
        <Field label="主視覺圖片 URL（建議 1800x800）" value={data.hero_image_url || ""} onChange={(v) => update("hero_image_url", v)} />
        <Field label="副標（如：信義區 14 年信賴 · 360 AI 認證）" value={data.subtitle || ""} onChange={(v) => update("subtitle", v)} />
        <Field label="Slogan（一句話品牌主張）" value={data.slogan || ""} onChange={(v) => update("slogan", v)} />
      </Section>

      <Section title="② 5 大特色亮點">
        <ListEditor
          items={data.features || []}
          max={5}
          onChange={(items) => update("features", items)}
          template={{ title: "", desc: "" }}
          render={(it, set) => (
            <>
              <Field label="標題" small value={it.title} onChange={(v) => set({ ...it, title: v })} />
              <Field label="內容（≤ 30 字）" small value={it.desc} onChange={(v) => set({ ...it, desc: v })} />
            </>
          )}
        />
      </Section>

      <Section title="③ 熱門精選療程（4 個）">
        <ListEditor
          items={data.signature_treatments || []}
          max={4}
          onChange={(items) => update("signature_treatments", items)}
          template={{ title: "", tagline: "", desc: "", price: "", badge: "🔥 招牌", image: "" }}
          render={(it, set) => (
            <>
              <Field label="療程名" small value={it.title || ""} onChange={(v) => set({ ...it, title: v })} />
              <Field label="一句話標語（如：一次淨膚到底）" small value={it.tagline || ""} onChange={(v) => set({ ...it, tagline: v })} />
              <Field label="描述" small value={it.desc || ""} onChange={(v) => set({ ...it, desc: v })} />
              <Field label="價格（純數字，如 8800）" small value={it.price || ""} onChange={(v) => set({ ...it, price: v })} />
              <Field label="徽章（emoji + 文字，如 🔥 招牌）" small value={it.badge || ""} onChange={(v) => set({ ...it, badge: v })} />
              <Field label="圖片 URL" small value={it.image || ""} onChange={(v) => set({ ...it, image: v })} />
            </>
          )}
        />
      </Section>

      <Section title="④ 院長形象">
        <Field label="姓名" value={data.director?.name || ""} onChange={(v) => update("director", { ...data.director, name: v })} />
        <Field label="職稱（如：院長｜醫學美容專科）" value={data.director?.title || ""} onChange={(v) => update("director", { ...data.director, title: v })} />
        <Field label="年資（純數字）" value={String(data.director?.years || "")} onChange={(v) => update("director", { ...data.director, years: v })} />
        <Field label="照片 URL（建議 800x800 正方形）" value={data.director?.photo || ""} onChange={(v) => update("director", { ...data.director, photo: v })} />
        <Field label="簡介（200 字內）" value={data.director?.desc || ""} multiline onChange={(v) => update("director", { ...data.director, desc: v })} />
      </Section>

      <Section title="⑤ 顧客前後對照（4 個）">
        <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>每張只需上傳一張臉部照片，前後對照效果由 CSS 濾鏡呈現</p>
        <ListEditor
          items={data.before_after || []}
          max={4}
          onChange={(items) => update("before_after", items)}
          template={{ treatment: "", duration: "", note: "", face: "" }}
          render={(it, set) => (
            <>
              <Field label="療程名" small value={it.treatment} onChange={(v) => set({ ...it, treatment: v })} />
              <Field label="時程（如：療程後 4 週）" small value={it.duration || ""} onChange={(v) => set({ ...it, duration: v })} />
              <Field label="改善描述" small value={it.note || ""} onChange={(v) => set({ ...it, note: v })} />
              <Field label="臉部照片 URL" small value={it.face || ""} onChange={(v) => set({ ...it, face: v })} />
            </>
          )}
        />
      </Section>

      <Section title="⑥ 院長推薦療程（4 個）">
        <ListEditor
          items={data.doctor_picks || []}
          max={4}
          onChange={(items) => update("doctor_picks", items)}
          template={{ title: "", target: "", items: [], doctor_note: "", price_from: "", image: "" }}
          render={(it, set) => (
            <>
              <Field label="方案名" small value={it.title} onChange={(v) => set({ ...it, title: v })} />
              <Field label="適合對象（如：適合：40+ / 輪廓鬆弛）" small value={it.target || ""} onChange={(v) => set({ ...it, target: v })} />
              <Field label="包含療程（用逗號分隔，如：童顏針, 電波拉皮）" small value={(it.items || []).join(", ")} onChange={(v) => set({ ...it, items: v.split(",").map(s => s.trim()).filter(Boolean) })} />
              <Field label="院長推薦語" small value={it.doctor_note || ""} onChange={(v) => set({ ...it, doctor_note: v })} />
              <Field label="起價（純數字）" small value={it.price_from || ""} onChange={(v) => set({ ...it, price_from: v })} />
              <Field label="圖片 URL" small value={it.image || ""} onChange={(v) => set({ ...it, image: v })} />
            </>
          )}
        />
      </Section>

      <Section title="⑦ 完整療程列表（最多 12 個）">
        <ListEditor
          items={data.treatments_full || []}
          max={12}
          onChange={(items) => update("treatments_full", items)}
          template={{ name: "", price: "", desc: "", image: "" }}
          render={(it, set) => (
            <>
              <Field label="療程名" small value={it.name} onChange={(v) => set({ ...it, name: v })} />
              <Field label="價格（純數字）" small value={it.price || ""} onChange={(v) => set({ ...it, price: v })} />
              <Field label="描述" small value={it.desc || ""} onChange={(v) => set({ ...it, desc: v })} />
              <Field label="圖片 URL（建議正方形）" small value={it.image || ""} onChange={(v) => set({ ...it, image: v })} />
            </>
          )}
        />
      </Section>

      <Section title="⑧ 客戶好評（最多 12 個）">
        <ListEditor
          items={data.testimonials || []}
          max={12}
          onChange={(items) => update("testimonials", items)}
          template={{ name: "", initial: "", text: "", rating: 5, treatment: "" }}
          render={(it, set) => (
            <>
              <Field label="顧客名（可暱稱）" small value={it.name} onChange={(v) => set({ ...it, name: v })} />
              <Field label="頭像字母（1 字）" small value={it.initial || ""} onChange={(v) => set({ ...it, initial: v })} />
              <Field label="評論內容" small multiline value={it.text} onChange={(v) => set({ ...it, text: v })} />
              <Field label="療程標籤" small value={it.treatment || ""} onChange={(v) => set({ ...it, treatment: v })} />
              <Field label="星等 1-5" small value={String(it.rating ?? 5)} onChange={(v) => set({ ...it, rating: parseInt(v) || 5 })} />
            </>
          )}
        />
      </Section>

      <Section title="⑨ 媒體報導（最多 10 個）">
        <ListEditor
          items={data.media_reports || []}
          max={10}
          onChange={(items) => update("media_reports", items)}
          template={{ outlet: "", title: "", date: "", tier: "B", url: "" }}
          render={(it, set) => (
            <>
              <Field label="媒體名（如：ETtoday）" small value={it.outlet} onChange={(v) => set({ ...it, outlet: v })} />
              <Field label="報導標題" small value={it.title} onChange={(v) => set({ ...it, title: v })} />
              <Field label="日期 YYYY-MM-DD" small value={it.date || ""} onChange={(v) => set({ ...it, date: v })} />
              <Field label="權威分級 A/B/C" small value={it.tier || "B"} onChange={(v) => set({ ...it, tier: v })} />
              <Field label="報導連結" small value={it.url || ""} onChange={(v) => set({ ...it, url: v })} />
            </>
          )}
        />
      </Section>

      {/* 底部再放一個儲存 */}
      <div style={{ position: "sticky", bottom: 16, marginTop: 32, display: "flex", justifyContent: "flex-end" }}>
        <button onClick={save} disabled={saving}
          style={{ padding: "12px 28px", background: saving ? "#A0AEC0" : "#0F172A", color: "#FBBF24", border: 0, borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(0,0,0,.12)" }}>
          {saving ? "儲存中…" : "💾 儲存全部變更"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 20, marginBottom: 14 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginTop: 0, marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #F1F5F9" }}>{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, multiline, small }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; small?: boolean }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 11, color: "#64748B", marginBottom: 4, fontWeight: 600 }}>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)}
          style={{ width: "100%", minHeight: small ? 50 : 70, padding: "8px 10px", fontSize: 13, border: "1px solid #E2E8F0", borderRadius: 6, fontFamily: "inherit", boxSizing: "border-box", resize: "vertical" }} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)}
          style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #E2E8F0", borderRadius: 6, boxSizing: "border-box" }} />
      )}
    </div>
  );
}

function ListEditor<T extends Record<string, any>>({
  items, onChange, template, render, max,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  template: T;
  render: (item: T, set: (x: T) => void) => React.ReactNode;
  max?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((it, i) => (
        <div key={i} style={{ padding: 14, background: "#F8FAFC", borderRadius: 8, position: "relative", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>#{i + 1}</span>
            <button onClick={() => { const next = [...items]; next.splice(i, 1); onChange(next); }}
              style={{ padding: "3px 10px", background: "#FEE2E2", color: "#B91C1C", border: 0, borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              刪除
            </button>
          </div>
          {render(it, (next) => { const arr = [...items]; arr[i] = next; onChange(arr); })}
        </div>
      ))}
      {(!max || items.length < max) && (
        <button onClick={() => onChange([...items, { ...template }])}
          style={{ padding: "10px", background: "#fff", color: "#0F172A", border: "1px dashed #94A3B8", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          + 新增{max ? `（${items.length}/${max}）` : ""}
        </button>
      )}
    </div>
  );
}
