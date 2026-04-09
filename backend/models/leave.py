from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class LeaveStatus(str, Enum):
    PENDING = "PENDING"
    DOCTOR_APPROVED = "DOCTOR_APPROVED"
    ADMIN_APPROVED = "ADMIN_APPROVED"
    REJECTED = "REJECTED"


class LeaveCreate(BaseModel):
    leave_from: str      # ISO date
    leave_to: str        # ISO date
    reason: str
    medical_condition: str
    doctor_name: Optional[str] = None
    document_ids: Optional[List[str]] = []


class LeaveAction(BaseModel):
    action: str          # approve / reject
    notes: Optional[str] = None
