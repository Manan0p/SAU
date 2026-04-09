from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class AppointmentStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    CONFIRMED = "CONFIRMED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"


class AppointmentCreate(BaseModel):
    doctor_id: str
    slot_datetime: str        # ISO format "2026-03-27T10:00:00"
    reason: str
    appointment_type: str = "general"   # general, follow_up, emergency


class AppointmentNote(BaseModel):
    diagnosis: str
    symptoms: str
    notes: str
    follow_up_required: bool = False
    follow_up_date: Optional[str] = None
