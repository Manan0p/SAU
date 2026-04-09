"""Prescription routes — create, list, view, dispense indicator."""
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timedelta
from bson import ObjectId
from config.database import prescriptions_col, users_col
from core.rbac import get_current_user, require_role
from models.prescription import PrescriptionCreate

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


def _ser(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.post("/", status_code=201)
async def create_prescription(data: PrescriptionCreate,
                               current_user: dict = Depends(require_role("doctor"))):
    """Doctor creates a digital prescription."""
    # Verify patient exists
    try:
        patient = await users_col().find_one({"_id": ObjectId(data.patient_id)})
    except Exception:
        patient = None
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    valid_until = (datetime.utcnow() + timedelta(days=data.valid_days)).date().isoformat()
    rx = {
        "patient_id": data.patient_id,
        "patient_name": patient["name"],
        "doctor_id": current_user["id"],
        "doctor_name": current_user["name"],
        "doctor_specialization": current_user.get("specialization", "General"),
        "appointment_id": data.appointment_id,
        "diagnosis": data.diagnosis,
        "medicines": [m.dict() for m in data.medicines],
        "notes": data.notes,
        "valid_until": valid_until,
        "is_dispensed": False,
        "dispensed_at": None,
        "dispensed_by": None,
        "status": "ACTIVE",
        "created_at": datetime.utcnow(),
    }
    result = await prescriptions_col().insert_one(rx)
    return {"prescription_id": str(result.inserted_id), "patient_name": patient["name"],
            "valid_until": valid_until, "medicine_count": len(data.medicines),
            "message": "Prescription created successfully."}


@router.get("/")
async def list_prescriptions(current_user: dict = Depends(get_current_user)):
    """List prescriptions (patient sees own, doctor sees theirs, pharmacy sees all active)."""
    role = current_user["role"]
    if role == "student":
        query = {"patient_id": current_user["id"]}
    elif role == "doctor":
        query = {"doctor_id": current_user["id"]}
    elif role == "pharmacy":
        query = {"is_dispensed": False, "status": "ACTIVE"}
    else:
        query = {}
    rxs = [_ser(rx) async for rx in prescriptions_col().find(query).sort("created_at", -1)]
    return rxs


@router.get("/{rx_id}")
async def get_prescription(rx_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single prescription."""
    try:
        rx = await prescriptions_col().find_one({"_id": ObjectId(rx_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid prescription ID")
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
    role = current_user["role"]
    if role == "student" and rx["patient_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return _ser(rx)


@router.patch("/{rx_id}/dispense")
async def mark_dispensed(rx_id: str, current_user: dict = Depends(require_role("pharmacy"))):
    """Pharmacy marks prescription as dispensed."""
    try:
        rx = await prescriptions_col().find_one({"_id": ObjectId(rx_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid prescription ID")
    if not rx:
        raise HTTPException(status_code=404, detail="Not found")
    if rx["is_dispensed"]:
        raise HTTPException(status_code=409, detail="Prescription already dispensed")
    await prescriptions_col().update_one(
        {"_id": ObjectId(rx_id)},
        {"$set": {"is_dispensed": True, "dispensed_at": datetime.utcnow().isoformat(),
                  "dispensed_by": current_user["name"], "status": "DISPENSED"}}
    )
    return {"message": "Prescription marked as dispensed.", "prescription_id": rx_id}
