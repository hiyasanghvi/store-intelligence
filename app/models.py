"""
models.py — SQLAlchemy ORM models and Pydantic API schemas.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, Any, List
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, Index
)
from sqlalchemy.sql import func

from app.database import Base


# ─── SQLAlchemy ORM Models ────────────────────────────────────────────────────

class Event(Base):
    """Stores all ingest events — indexed for fast metric queries."""
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(36), unique=True, nullable=False, index=True)
    store_id = Column(String(50), nullable=False, index=True)
    camera_id = Column(String(50), nullable=False)
    visitor_id = Column(String(50), nullable=False, index=True)
    event_type = Column(String(30), nullable=False, index=True)
    timestamp = Column(String(30), nullable=False, index=True)
    zone_id = Column(String(50), nullable=True)
    dwell_ms = Column(Integer, default=0)
    is_staff = Column(Boolean, default=False)
    confidence = Column(Float, default=1.0)
    queue_depth = Column(Integer, nullable=True)
    sku_zone = Column(String(50), nullable=True)
    session_seq = Column(Integer, default=0)
    ingested_at = Column(DateTime, default=func.now())

    __table_args__ = (
        Index("ix_events_store_type", "store_id", "event_type"),
        Index("ix_events_store_visitor", "store_id", "visitor_id"),
        Index("ix_events_store_ts", "store_id", "timestamp"),
    )


class POSTransaction(Base):
    """Stores POS transactions for conversion rate correlation."""
    __tablename__ = "pos_transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(String(50), unique=True, nullable=False)
    store_id = Column(String(50), nullable=False, index=True)
    timestamp = Column(String(30), nullable=False)
    basket_value_inr = Column(Float, default=0.0)

    __table_args__ = (
        Index("ix_pos_store_ts", "store_id", "timestamp"),
    )


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

VALID_EVENT_TYPES = {
    "ENTRY", "EXIT", "ZONE_ENTER", "ZONE_EXIT",
    "ZONE_DWELL", "BILLING_QUEUE_JOIN",
    "BILLING_QUEUE_ABANDON", "REENTRY"
}


class EventMetadataIn(BaseModel):
    queue_depth: Optional[int] = None
    sku_zone: Optional[str] = None
    session_seq: int = 0

    model_config = {"extra": "allow"}


class EventIn(BaseModel):
    """Pydantic schema for event ingestion — mirrors the detection pipeline output."""
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    store_id: str
    camera_id: str
    visitor_id: str
    event_type: str
    timestamp: str
    zone_id: Optional[str] = None
    dwell_ms: int = 0
    is_staff: bool = False
    confidence: float = Field(ge=0.0, le=1.0)
    metadata: EventMetadataIn = Field(default_factory=EventMetadataIn)

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v: str) -> str:
        if v not in VALID_EVENT_TYPES:
            raise ValueError(f"Invalid event_type '{v}'. Must be one of: {sorted(VALID_EVENT_TYPES)}")
        return v

    @field_validator("timestamp")
    @classmethod
    def validate_timestamp(cls, v: str) -> str:
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError(f"Invalid timestamp format: {v}. Expected ISO-8601 UTC.")
        return v

    @field_validator("store_id")
    @classmethod
    def validate_store_id(cls, v: str) -> str:
        if not v or not (v.startswith("STORE_") or v.startswith("ST")):
            raise ValueError(f"Invalid store_id: '{v}'. Must start with 'STORE_' or 'ST'.")
        return v


class IngestBatch(BaseModel):
    events: List[EventIn] = Field(max_length=500)


class IngestResponse(BaseModel):
    accepted: int
    rejected: int
    duplicate: int
    errors: List[dict] = []


# ─── API Response Schemas ────────────────────────────────────────────────────
class OpportunityRadar(BaseModel):
    zone: str
    priority_score: int
    potential_gain: str


class BeautyBlackHole(BaseModel):
    zone: str
    lost_visitors: int
    conversion_gap: float
    risk_level: str


class AdvisorRecommendation(BaseModel):
    recommendation: str
    zone: str
    expected_impact: str

class ZoneDwellMetric(BaseModel):
    zone_id: str
    avg_dwell_seconds: float
    visit_count: int
    engagement_band: str | None = None
    curiosity_score: float | None = None
    sku_zone: str | None = None


class StoreMetrics(BaseModel):
    store_id: str
    unique_visitors: int
    conversion_rate: float
    avg_dwell_per_zone: List[ZoneDwellMetric]
    queue_depth: int
    abandonment_rate: float

    opportunity_radar: Optional[OpportunityRadar] = None
    beauty_black_hole: Optional[BeautyBlackHole] = None
    customer_archetypes: List[dict] = []

    computed_at: str


class FunnelStage(BaseModel):
    stage: str
    count: int
    drop_off_pct: float


class FunnelResponse(BaseModel):
    store_id: str
    stages: List[FunnelStage]
    computed_at: str


class HeatmapZone(BaseModel):
    zone_id: str
    normalised_score: float          # 0–100
    visit_count: int
    avg_dwell_seconds: float
    sku_zone: Optional[str]
    engagement_band: str
    curiosity_score: float


class HeatmapResponse(BaseModel):
    store_id: str
    zones: List[HeatmapZone]
    data_confidence: bool            # False if < 20 sessions
    computed_at: str


class Anomaly(BaseModel):
    anomaly_id: str
    anomaly_type: str                # BILLING_QUEUE_SPIKE | CONVERSION_DROP | DEAD_ZONE | STALE_FEED
    severity: str                    # INFO | WARN | CRITICAL
    description: str
    suggested_action: str
    detected_at: str
    zone_id: Optional[str] = None
    value: Optional[float] = None    # e.g. current queue depth or conversion rate


class AnomaliesResponse(BaseModel):
    store_id: str
    anomalies: List[Anomaly]
    checked_at: str


class StoreHealth(BaseModel):
    store_id: str
    last_event_timestamp: Optional[str]
    lag_seconds: Optional[float]
    status: str                      # HEALTHY | STALE_FEED | NO_DATA


class HealthResponse(BaseModel):
    service_status: str              # UP | DEGRADED | DOWN
    database_status: str             # OK | ERROR
    stores: List[StoreHealth]
    checked_at: str
