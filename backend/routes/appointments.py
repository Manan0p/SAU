"""Appointments routes — book, list, update status, add notes."""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime
from typing import Optional
from bson import ObjectId
from config.database import appointments_col, users_col
from core.rbac import get_current_user, require_role
from models.appointment import AppointmentCreate, AppointmentNote
from services.appointment_service import get_doctor_slots, get_queue_token, estimate_wait_time

router = APIRouter(prefix="/appointments", tags=["Appointments"])


def _ser(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/doctors")
async def list_doctors(specialization: Optional[str] = None, _=Depends(get_current_user)):
    """List all doctors, optionally filtered by specialization."""
    query = {"role": "doctor"}
    if specialization:
        query["specialization"] = {"$regex": specialization, "$options": "i"}
    doctors = []
    async for u in users_col().find(query, {"password_hash": 0}):
        u["id"] = str(u.pop("_id"))
        doctors.append(u)
    return doctors


@router.get("/slots/{doctor_id}")
async def available_slots(doctor_id: str, date: str = Query(...), _=Depends(get_current_user)):
    """Get available 30-min slots for a doctor on a date (YYYY-MM-DD)."""
    try:
        slots = await get_doctor_slots(doctor_id, date + "T00:00:00")
        return {"doctor_id": doctor_id, "date": date, "slots": slots}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/", status_code=201)
async def book_appointment(data: AppointmentCreate,
                           current_user: dict = Depends(require_role("student"))):
    """Book an appointment slot."""
    # Check slot is not already taken
    existing = await appointments_col().find_one({
        "doctor_id": data.doctor_id,
        "slot_datetime": data.slot_datetime,
        "status": {"$nin": ["CANCELLED", "NO_SHOW"]},
    })
    if existing:
        raise HTTPException(status_code=409, detail="This slot is already booked. Please choose another.")

    # Get doctor info
    try:
        doctor = await users_col().find_one({"_id": ObjectId(data.doctor_id)})
    except Exception:
        doctor = None
    if not doctor or doctor["role"] != "doctor":
        raise HTTPException(status_code=404, detail="Doctor not found.")

    token = await get_queue_token(data.doctor_id, data.slot_datetime)
    wait_time = await estimate_wait_time(data.doctor_id, data.slot_datetime)

    appt = {
        "student_id": current_user["id"],
        "student_name": current_user["name"],
        "doctor_id": data.doctor_id,
        "doctor_name": doctor["name"],
        "doctor_specialization": doctor.get("specialization", "General"),
        "slot_datetime": data.slot_datetime,
        "reason": data.reason,
        "appointment_type": data.appointment_type,
        "status": "SCHEDULED",
        "queue_token": token,
        "estimated_wait_minutes": wait_time,
        "consultation_notes": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await appointments_col().insert_one(appt)
    return {"appointment_id": str(result.inserted_id), "status": "SCHEDULED",
            "queue_token": token, "estimated_wait_minutes": wait_time,
            "doctor_name": doctor["name"], "slot_datetime": data.slot_datetime,
            "message": "Appointment booked successfully!"}


@router.get("/")
async def list_appointments(current_user: dict = Depends(get_current_user)):
    """List appointments (students see own, doctors see their schedule)."""
    role = current_user["role"]
    if role == "student":
        query = {"student_id": current_user["id"]}
    elif role == "doctor":
        query = {"doctor_id": current_user["id"]}
    else:
        query = {}
    appts = [_ser(a) async for a in appointments_col().find(query).sort("slot_datetime", 1)]
    return appts


@router.patch("/{appt_id}/status")
async def update_status(appt_id: str, new_status: str,
                        current_user: dict = Depends(require_role("doctor", "admin"))):
    """Update appointment status (doctor/admin only)."""
    valid = ["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]
    if new_status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid}")
    try:
        await appointments_col().update_one(
            {"_id": ObjectId(appt_id)},
            {"$set": {"status": new_status, "updated_at": datetime.utcnow()}}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid appointment ID")
    return {"appointment_id": appt_id, "new_status": new_status}


@router.post("/{appt_id}/notes")
async def add_consultation_notes(appt_id: str, notes: AppointmentNote,
                                  current_user: dict = Depends(require_role("doctor"))):
    """Doctor adds consultation notes and diagnosis to an appointment."""
    try:
        appt = await appointments_col().find_one({"_id": ObjectId(appt_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid appointment ID")
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appt["doctor_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only add notes to your own appointments")

    note_doc = {
        "diagnosis": notes.diagnosis, "symptoms": notes.symptoms,
        "notes": notes.notes, "follow_up_required": notes.follow_up_required,
        "follow_up_date": notes.follow_up_date,
        "added_by": current_user["name"], "added_at": datetime.utcnow().isoformat(),
    }
    await appointments_col().update_one(
        {"_id": ObjectId(appt_id)},
        {"$set": {"consultation_notes": note_doc, "status": "COMPLETED",
                  "updated_at": datetime.utcnow()}}
    )
    return {"message": "Consultation notes saved.", "appointment_id": appt_id}


@router.delete("/{appt_id}")
async def cancel_appointment(appt_id: str, current_user: dict = Depends(get_current_user)):
    """Cancel an appointment."""
    try:
        appt = await appointments_col().find_one({"_id": ObjectId(appt_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid appointment ID")
    if not appt:
        raise HTTPException(status_code=404, detail="Not found")
    if current_user["role"] == "student" and appt["student_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    await appointments_col().update_one(
        {"_id": ObjectId(appt_id)},
        {"$set": {"status": "CANCELLED", "updated_at": datetime.utcnow()}}
    )
    return {"message": "Appointment cancelled.", "appointment_id": appt_id}
