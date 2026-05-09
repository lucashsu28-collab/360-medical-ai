"""GCP Cloud Scheduler wrapper service

讓 Admin 介面可以管理排程（看 cron / 改 cron / 啟停 / 立即觸發）

所需 IAM：Cloud Run 的 service account 需要 `roles/cloudscheduler.admin`
若權限不足，errors 會清楚帶出，Lucas 用以下 gcloud 命令補：
  gcloud projects add-iam-policy-binding medical-ai-489522 \\
    --member=serviceAccount:<SA_EMAIL> \\
    --role=roles/cloudscheduler.admin
"""
from __future__ import annotations

import os
from typing import Any

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "medical-ai-489522")
LOCATION = os.getenv("GCP_SCHEDULER_LOCATION", "asia-east1")


def _get_client():
    """延遲 import，避免 import-time 失敗影響整個 backend"""
    try:
        from google.cloud import scheduler_v1
        return scheduler_v1.CloudSchedulerClient()
    except ImportError as e:
        raise RuntimeError(f"google-cloud-scheduler not installed: {e}")


def _parent_path() -> str:
    return f"projects/{PROJECT_ID}/locations/{LOCATION}"


def _job_path(job_id: str) -> str:
    return f"{_parent_path()}/jobs/{job_id}"


def _serialize(job: Any) -> dict:
    """把 Cloud Scheduler Job protobuf 轉成 JSON-serializable dict"""
    name = job.name.split("/")[-1] if job.name else ""
    target_uri = job.http_target.uri if job.http_target and job.http_target.uri else ""
    method = ""
    if job.http_target and hasattr(job.http_target.http_method, "name"):
        method = job.http_target.http_method.name
    state_name = ""
    if hasattr(job.state, "name"):
        state_name = job.state.name
    last_attempt = job.last_attempt_time.isoformat() if job.last_attempt_time else None
    schedule_time = job.schedule_time.isoformat() if job.schedule_time else None

    return {
        "id": name,
        "schedule": job.schedule,
        "time_zone": job.time_zone,
        "state": state_name,                  # ENABLED / PAUSED / DISABLED / UPDATE_FAILED
        "uri": target_uri,
        "http_method": method,
        "description": job.description,
        "last_attempt_time": last_attempt,
        "next_schedule_time": schedule_time,
    }


def list_jobs() -> list[dict]:
    client = _get_client()
    request = {"parent": _parent_path()}
    return [_serialize(job) for job in client.list_jobs(request=request)]


def get_job(job_id: str) -> dict:
    client = _get_client()
    job = client.get_job(name=_job_path(job_id))
    return _serialize(job)


def update_schedule(job_id: str, schedule: str | None = None, time_zone: str | None = None) -> dict:
    """改 cron 表達式或時區"""
    from google.cloud import scheduler_v1
    from google.protobuf import field_mask_pb2

    client = _get_client()
    job = client.get_job(name=_job_path(job_id))
    paths = []
    if schedule:
        job.schedule = schedule
        paths.append("schedule")
    if time_zone:
        job.time_zone = time_zone
        paths.append("time_zone")
    if not paths:
        return _serialize(job)

    update_mask = field_mask_pb2.FieldMask(paths=paths)
    updated = client.update_job(job=job, update_mask=update_mask)
    return _serialize(updated)


def pause_job(job_id: str) -> dict:
    client = _get_client()
    job = client.pause_job(name=_job_path(job_id))
    return _serialize(job)


def resume_job(job_id: str) -> dict:
    client = _get_client()
    job = client.resume_job(name=_job_path(job_id))
    return _serialize(job)


def run_job_now(job_id: str) -> dict:
    """立即觸發（對應「手動執行」按鈕）"""
    client = _get_client()
    job = client.run_job(name=_job_path(job_id))
    return _serialize(job)
