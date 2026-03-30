"""診所 Email 通知服務 — 新預約時自動寄送 HTML 郵件給診所諮詢師"""
import os
from typing import Optional

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

_MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
_MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
_MAIL_FROM = os.getenv("MAIL_FROM", "noreply@360medical.ai")
_MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
_MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
_MAIL_TLS = os.getenv("MAIL_TLS", "True") == "True"
_MAIL_SSL = os.getenv("MAIL_SSL", "False") == "True"


def _get_conf() -> Optional[ConnectionConfig]:
    if not _MAIL_USERNAME or not _MAIL_PASSWORD:
        return None
    return ConnectionConfig(
        MAIL_USERNAME=_MAIL_USERNAME,
        MAIL_PASSWORD=_MAIL_PASSWORD,
        MAIL_FROM=_MAIL_FROM,
        MAIL_PORT=_MAIL_PORT,
        MAIL_SERVER=_MAIL_SERVER,
        MAIL_STARTTLS=_MAIL_TLS,
        MAIL_SSL_TLS=_MAIL_SSL,
        USE_CREDENTIALS=True,
    )


async def send_appointment_notification(
    to_email: str,
    clinic_name: str,
    appointment: dict,
) -> None:
    """發送新預約 HTML 通知郵件給診所。Email 未設定時靜默略過。"""
    conf = _get_conf()
    if not conf:
        print("[email] MAIL_USERNAME/PASSWORD not set, skipping notification")
        return

    patient_name = appointment.get("patient_name") or appointment.get("user_display_name") or "—"
    patient_phone = appointment.get("patient_phone") or appointment.get("user_phone") or "—"
    treatment = appointment.get("treatment_name") or "—"
    preferred_date = appointment.get("preferred_date") or "—"
    preferred_time = appointment.get("preferred_time") or ""
    note = appointment.get("note") or "無"

    html = f"""
<div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;">
  <div style="background:#2B6CB0;border-radius:8px 8px 0 0;padding:20px 24px;">
    <h2 style="color:#fff;margin:0;font-size:18px;">📅 新預約通知</h2>
    <p style="color:#BEE3F8;margin:4px 0 0;font-size:13px;">360 醫美 AI 大調查</p>
  </div>
  <div style="background:#fff;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 8px 8px;padding:24px;">
    <p style="color:#1A202C;font-size:14px;margin:0 0 16px;">
      <strong>{clinic_name}</strong> 有一筆新的預約申請，請盡快在 LINE OA Manager 與患者聯繫確認。
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="background:#F7FAFC;">
        <td style="padding:10px 12px;color:#718096;width:100px;border-bottom:1px solid #EDF2F7;">患者姓名</td>
        <td style="padding:10px 12px;color:#1A202C;font-weight:500;border-bottom:1px solid #EDF2F7;">{patient_name}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;color:#718096;border-bottom:1px solid #EDF2F7;">聯絡電話</td>
        <td style="padding:10px 12px;color:#1A202C;border-bottom:1px solid #EDF2F7;">{patient_phone}</td>
      </tr>
      <tr style="background:#F7FAFC;">
        <td style="padding:10px 12px;color:#718096;border-bottom:1px solid #EDF2F7;">療程</td>
        <td style="padding:10px 12px;color:#1A202C;border-bottom:1px solid #EDF2F7;">{treatment}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;color:#718096;border-bottom:1px solid #EDF2F7;">希望時間</td>
        <td style="padding:10px 12px;color:#1A202C;border-bottom:1px solid #EDF2F7;">{preferred_date} {preferred_time}</td>
      </tr>
      <tr style="background:#F7FAFC;">
        <td style="padding:10px 12px;color:#718096;">備註</td>
        <td style="padding:10px 12px;color:#1A202C;">{note}</td>
      </tr>
    </table>
    <div style="margin-top:20px;padding:12px 16px;background:#EBF8FF;border-radius:8px;font-size:12px;color:#2B6CB0;">
      💡 患者已在 LINE 中等待您的聯繫，請盡快開啟 LINE OA Manager 接洽。
    </div>
    <p style="margin-top:16px;font-size:11px;color:#A0AEC0;text-align:center;">
      此郵件由 360 醫美 AI 大調查系統自動發送，請勿直接回覆。
    </p>
  </div>
</div>
"""
    subject = f"【新預約】{clinic_name} — {patient_name} / {treatment}"
    message = MessageSchema(
        subject=subject,
        recipients=[to_email],
        body=html,
        subtype=MessageType.html,
    )
    fm = FastMail(conf)
    await fm.send_message(message)
