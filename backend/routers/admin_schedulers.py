"""Admin 排程管理 API

包裝 GCP Cloud Scheduler，讓 admin 介面可以：
- GET /api/admin/schedulers          列表
- PATCH /api/admin/schedulers/{id}   改 cron / pause/resume
- POST /api/admin/schedulers/{id}/run 立即觸發
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import cloud_scheduler


router = APIRouter(prefix="/api/admin/schedulers", tags=["admin-schedulers"])


# 為每個 job 補一個給人看的中文描述（HANDOVER 級資訊）
_JOB_DESCRIPTIONS: dict[str, dict] = {
    "places-update": {
        "icon": "⭐",
        "name": "Google Places 評分更新",
        "description": "更新全部 904 家診所的 Google 評分與評論數",
        "category": "core",
    },
    "judicial-update": {
        "icon": "⚖️",
        "name": "司法院裁判書更新",
        "description": "查詢 904 家診所的司法案件數",
        "category": "core",
    },
    "mohw-update": {
        "icon": "🏛️",
        "name": "健保署診所資料同步",
        "description": "更新衛福部健保署醫事機構登記資料",
        "category": "core",
    },
    "penalty-news-update": {
        "icon": "⚠️",
        "name": "稽查違規新聞抓取（P3-A）",
        "description": "Google News 7 組關鍵字 + Gemini 提取處分資料",
        "category": "p3a",
    },
    "news-mentions-update": {
        "icon": "📰",
        "name": "媒體口碑（第 5 維度）",
        "description": "Google News 8 組醫美關鍵字 + Gemini 情緒+業配判定",
        "category": "p3b",
    },
}


def _enrich(job: dict) -> dict:
    meta = _JOB_DESCRIPTIONS.get(job["id"], {})
    return {**job, **meta}


@router.get("")
async def list_schedulers():
    try:
        jobs = cloud_scheduler.list_jobs()
        return {"items": [_enrich(j) for j in jobs]}
    except Exception as e:
        raise HTTPException(500, f"無法讀取排程清單：{e}")


@router.get("/{job_id}")
async def get_scheduler(job_id: str):
    try:
        return _enrich(cloud_scheduler.get_job(job_id))
    except Exception as e:
        raise HTTPException(500, f"無法讀取排程：{e}")


class PatchBody(BaseModel):
    schedule: str | None = None        # cron 表達式
    time_zone: str | None = None
    action: str | None = None          # 'pause' / 'resume'


@router.patch("/{job_id}")
async def patch_scheduler(job_id: str, body: PatchBody):
    try:
        # 1. action: pause / resume
        if body.action == "pause":
            return _enrich(cloud_scheduler.pause_job(job_id))
        if body.action == "resume":
            return _enrich(cloud_scheduler.resume_job(job_id))

        # 2. 修改 schedule / time_zone
        if body.schedule or body.time_zone:
            return _enrich(cloud_scheduler.update_schedule(
                job_id, schedule=body.schedule, time_zone=body.time_zone,
            ))

        raise HTTPException(400, "no valid action")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"操作失敗：{e}")


@router.post("/{job_id}/run")
async def run_scheduler_now(job_id: str):
    try:
        return _enrich(cloud_scheduler.run_job_now(job_id))
    except Exception as e:
        raise HTTPException(500, f"觸發失敗：{e}")
