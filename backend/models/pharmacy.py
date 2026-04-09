from pydantic import BaseModel
from typing import Optional


class PharmacyItem(BaseModel):
    medicine_name: str
    generic_name: Optional[str] = None
    category: str = "general"          # antibiotic, analgesic, general
    current_stock: int
    min_stock_threshold: int = 20
    unit: str = "tablets"              # tablets, ml, capsules
    supplier: Optional[str] = None
    expiry_date: Optional[str] = None
    price_per_unit: float = 0.0


class DispenseRequest(BaseModel):
    prescription_id: str
    patient_id: str
    medicines_dispensed: list          # list of {name, quantity}
    notes: Optional[str] = None


class PharmacyItemUpdate(BaseModel):
    current_stock: Optional[int] = None
    min_stock_threshold: Optional[int] = None
    expiry_date: Optional[str] = None
    price_per_unit: Optional[float] = None
