"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/portal/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.detail || "帳號或密碼錯誤");
        return;
      }
      const { token, clinic_id } = await res.json();
      localStorage.setItem("portal_token", token);
      localStorage.setItem("portal_clinic_id", clinic_id);
      router.replace(`/portal/${clinic_id}`);
    } catch {
      setError("連線失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--blue-xl)] text-2xl">
            🏥
          </div>
          <h1 className="text-[22px] font-black text-[var(--ink)]">診所後台登入</h1>
          <p className="mt-1 text-[13px] text-[var(--muted)]">360醫療AI大調查 · 合作診所管理系統</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[14px] border border-[var(--line)] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,.06)] space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--ink)]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="clinic@example.com"
              className="w-full rounded-[8px] border border-[var(--line)] px-3 py-2.5 text-[14px] focus:border-[var(--blue)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--ink)]">密碼</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-[8px] border border-[var(--line)] px-3 py-2.5 text-[14px] focus:border-[var(--blue)] focus:outline-none"
            />
          </div>
          {error && <p className="text-[13px] text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[8px] bg-[var(--blue)] py-3 text-[14px] font-bold text-white shadow-[0_2px_8px_rgba(0,70,184,.2)] transition-opacity disabled:opacity-60"
          >
            {loading ? "登入中..." : "登入"}
          </button>
        </form>

        <p className="mt-4 text-center text-[12px] text-[var(--muted)]">
          尚未有帳號？請聯繫{" "}
          <a href="https://lin.ee/6sTCRzm" target="_blank" rel="noopener noreferrer" className="text-[#06C755] font-medium">
            360醫療 LINE OA
          </a>{" "}
          申請合作
        </p>
      </div>
    </div>
  );
}
