"""Medical records routes — history, reports, and secure access."""
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from config.database import records_col, appointments_col, prescriptions_col
from core.rbac import get_current_user, require_role

router = APIRouter(prefix="/records", tags=["Medical Records"])

def _ser(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc

@router.get("/patient/{patient_id}")
async def get_patient_history(patient_id: str, current_user: dict = Depends(get_current_user)):
    """Get full medical history for a patient (student sees own, doctor/admin see all)."""
    if current_user["role"] == "student" and current_user["id"] != patient_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Aggregate history from appointments (consultations) and prescriptions
    appts = [_ser(a) async for a in appointments_col().find({"student_id": patient_id, "status": "COMPLETED"}).sort("slot_datetime", -1)]
    rxs = [_ser(r) async for r in prescriptions_col().find({"patient_id": patient_id}).sort("created_at", -1)]
    
    # Combined history entries
    history = []
    for a in appts:
        history.append({
            "type": "CONSULTATION",
            "date": a["slot_datetime"],
            "doctor": a["doctor_name"],
            "doctor_specialization": a.get("doctor_specialization"),
            "data": a.get("consultation_notes"),
            "id": a["id"]
        })
    for r in rxs:
        history.append({
            "type": "PRESCRIPTION",
            "date": r["created_at"].isoformat(),
            "doctor": r["doctor_name"],
            "data": {
                "diagnosis": r["diagnosis"],
                "medicines": r["medicines"],
                "status": r["status"]
            },
            "id": r["id"]
        })
    
    # Sort history by date descending
    history.sort(key=lambda x: x["date"], reverse=True)
    
    return {
        "patient_id": patient_id,
        "history_count": len(history),
        "history": history
    }

@router.get("/summary/{patient_id}")
async def get_patient_summary(patient_id: str, current_user: dict = Depends(require_role("doctor", "admin"))):
    """Get a summarized medical history for quick doctor reference."""
    history_obj = await get_patient_history(patient_id, current_user)
    history = history_obj["history"]
    
    # Extract unique diagnoses and hospitals/doctors visited
    diagnoses = list(set([h["data"]["diagnosis"] for h in history if h.get("data") and h["data"].get("diagnosis")]))
    doctors = list(set([h["doctor"] for h in history]))
    
    recent_visit = history[0]["date"] if history else None
    
    return {
        "patient_id": patient_id,
        "total_visits": len([h for h in history if h["type"] == "CONSULTATION"]),
        "diagnoses": diagnoses,
        "primary_doctors": doctors[:3],
        "last_visit": recent_visit,
        "status": "Healthy" if not diagnoses else "Under Observation"
    }

@router.post("/reports/upload", status_code=201)
async def upload_report(patient_id: str, report_type: str, file_path: str, current_user: dict = Depends(require_role("doctor", "admin"))):
    """Log an externally uploaded report for a patient."""
    report = {
        "patient_id": patient_id,
        "report_type": report_type,
        "file_path": file_path,
        "uploaded_by": current_user["name"],
        "created_at": datetime.utcnow()
    }
    result = await records_col().insert_one(report)
    return {"report_id": str(result.inserted_id), "message": "Report logged."}
