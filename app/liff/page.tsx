"use client";

import { useEffect, useState } from "react";
import liff from "@line/liff";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const LINE_ADD_URL = "https://lin.ee/6sTCRzm";

export default function LiffPage() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("正在準備加好友…");

  useEffect(() => {
    if (!LIFF_ID) {
      setStatus("error");
      setMessage("未設定 NEXT_PUBLIC_LIFF_ID");
      return;
    }
    if (!API_BASE) {
      setStatus("error");
      setMessage("未設定 NEXT_PUBLIC_API_URL（後端網址）");
      return;
    }

    const run = async () => {
      try {
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        const profile = await liff.getProfile();
        const userId = profile.userId;

        const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
        const type = params.get("type") || "";
        const id = params.get("id") || "";
        const name = params.get("name") || "";

        if (!type || !id) {
          setMessage("缺少參數：請從診所／醫師頁的「加 LINE」按鈕進入");
          setStatus("error");
          return;
        }

        const state = `${type}_${id}`;
        const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/liff-state`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, state }),
        });
        if (!res.ok) {
          throw new Error(`後端回傳 ${res.status}`);
        }

        setMessage(`已記錄【${name || id}】，即將開啟加好友…`);
        setStatus("ok");

        liff.openWindow({ url: LINE_ADD_URL, external: true });
      } catch (e) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "發生錯誤，請稍後再試");
      }
    };

    run();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col items-center justify-center px-4">
      {status === "loading" && (
        <p className="text-[var(--ink)] text-center">正在準備加好友…</p>
      )}
      {status === "ok" && (
        <p className="text-[var(--blue)] text-center font-medium">{message}</p>
      )}
      {status === "error" && (
        <p className="text-red-600 text-center">{message}</p>
      )}
    </div>
  );
}
