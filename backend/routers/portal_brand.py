"""診所後台「品牌頁」編輯 API

讓合作診所自己編輯所有 mockup 對應欄位（Hero/亮點/療程/院長/Before-After 等）
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from database import AsyncSessionLocal, get_db
from models.clinic_brand_page import ClinicBrandPage
from routers.portal import _auth


router = APIRouter(prefix="/portal/{clinic_id}/brand", tags=["portal-brand"])


def _serialize(p: ClinicBrandPage | None, clinic_id: str) -> dict[str, Any]:
    """缺資料時返回空殼，前端 form 才有完整 keys"""
    if not p:
        return {
            "clinic_id": clinic_id,
            "hero_image_url": None,
            "slogan": None,
            "subtitle": None,
            "features": [],
            "signature_treatments": [],
            "director": None,
            "before_after": [],
            "doctor_picks": [],
            "treatments_full": [],
            "testimonials": [],
            "media_reports": [],
            "updated_at": None,
        }
    return {
        "clinic_id": p.clinic_id,
        "hero_image_url": p.hero_image_url,
        "slogan": p.slogan,
        "subtitle": p.subtitle,
        "features": p.features or [],
        "signature_treatments": p.signature_treatments or [],
        "director": p.director,
        "before_after": p.before_after or [],
        "doctor_picks": p.doctor_picks or [],
        "treatments_full": p.treatments_full or [],
        "testimonials": p.testimonials or [],
        "media_reports": p.media_reports or [],
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


@router.get("")
async def get_brand_page(
    clinic_id: str,
    authorization: str | None = Header(default=None),
):
    await _auth(authorization, clinic_id)
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(ClinicBrandPage).where(ClinicBrandPage.clinic_id == clinic_id)
        )
        p = result.scalar_one_or_none()
        return _serialize(p, clinic_id)


class BrandPageBody(BaseModel):
    hero_image_url: str | None = None
    slogan: str | None = None
    subtitle: str | None = None
    features: list | None = None
    signature_treatments: list | None = None
    director: dict | None = None
    before_after: list | None = None
    doctor_picks: list | None = None
    treatments_full: list | None = None
    testimonials: list | None = None
    media_reports: list | None = None


@router.put("")
async def update_brand_page(
    clinic_id: str,
    body: BrandPageBody,
    authorization: str | None = Header(default=None),
):
    """upsert：沒紀錄就建、有紀錄就更新"""
    await _auth(authorization, clinic_id)

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(ClinicBrandPage).where(ClinicBrandPage.clinic_id == clinic_id)
        )
        p = result.scalar_one_or_none()

        data = body.model_dump(exclude_unset=True)

        if p is None:
            # 新建
            p = ClinicBrandPage(clinic_id=clinic_id, **data)
            session.add(p)
        else:
            for k, v in data.items():
                setattr(p, k, v)
            p.updated_at = datetime.utcnow()

        await session.commit()
        await session.refresh(p)

        return {"ok": True, "data": _serialize(p, clinic_id)}
