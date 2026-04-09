from pydantic import BaseModel
from typing import Optional, List


class MedicineItem(BaseModel):
    name: str
    dosage: str
    frequency: str       # "twice daily", "once at night"
    duration_days: int
    quantity: int
    instructions: Optional[str] = None


class PrescriptionCreate(BaseModel):
    patient_id: str
    appointment_id: Optional[str] = None
    diagnosis: str
    medicines: List[MedicineItem]
    notes: Optional[str] = None
    valid_days: int = 30
