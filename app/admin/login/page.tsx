"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setError("");
    const correct = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin360";
    if (password === correct) {
      localStorage.setItem("admin_token", "authenticated");
      router.replace("/admin");
    } else {
      setError("密碼錯誤，請再試一次");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F172A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#1E293B",
          borderRadius: 16,
          padding: "40px 36px",
          width: 360,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏥</div>
          <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0 }}>
            360醫美 Admin
          </h1>
          <p style={{ color: "#64748B", fontSize: 13, marginTop: 6 }}>後台管理系統</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", color: "#94A3B8", fontSize: 13, marginBottom: 6 }}>
            管理員密碼
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="請輸入密碼"
            autoFocus
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "#0F172A",
              border: `1px solid ${error ? "#EF4444" : "#334155"}`,
              borderRadius: 8,
              color: "#fff",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {error && (
            <p style={{ color: "#EF4444", fontSize: 12, marginTop: 6 }}>{error}</p>
          )}
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || !password}
          style={{
            width: "100%",
            padding: "11px",
            background: password ? "#3B82F6" : "#334155",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: password ? "pointer" : "not-allowed",
            transition: "background 0.15s",
          }}
        >
          {loading ? "登入中..." : "登入"}
        </button>
      </div>
    </div>
  );
}
