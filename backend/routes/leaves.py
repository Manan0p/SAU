"""Medical leave routes — apply, list, view, approve/reject."""
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, date
from typing import Optional
from bson import ObjectId
from config.database import leaves_col
from core.rbac import get_current_user, require_role
from models.leave import LeaveCreate, LeaveAction

router = APIRouter(prefix="/leaves", tags=["Medical Leaves"])


def _ser(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.post("/", status_code=201)
async def apply_leave(data: LeaveCreate, current_user: dict = Depends(require_role("student"))):
    """Student applies for medical leave."""
    # Compute total days
    try:
        from_dt = datetime.fromisoformat(data.leave_from)
        to_dt = datetime.fromisoformat(data.leave_to)
        total_days = (to_dt - from_dt).days + 1
    except Exception:
        raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD.")

    leave = {
        "student_id": current_user["id"],
        "student_name": current_user["name"],
        "leave_from": data.leave_from,
        "leave_to": data.leave_to,
        "total_days": total_days,
        "reason": data.reason,
        "medical_condition": data.medical_condition,
        "doctor_name": data.doctor_name,
        "document_ids": data.document_ids,
        "status": "PENDING",
        "doctor_action": None,
        "admin_action": None,
        "activity_log": [{
            "action": "LEAVE_APPLIED", "by": current_user["name"],
            "role": "student", "timestamp": datetime.utcnow().isoformat()
        }],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await leaves_col().insert_one(leave)
    return {"leave_id": str(result.inserted_id), "status": "PENDING",
            "total_days": total_days, "message": "Medical leave application submitted."}


@router.get("/")
async def list_leaves(current_user: dict = Depends(get_current_user)):
    """List leaves (student: own, doctor/admin: all pending)."""
    if current_user["role"] == "student":
        query = {"student_id": current_user["id"]}
    elif current_user["role"] in ["doctor", "admin"]:
        query = {"status": {"$in": ["PENDING", "DOCTOR_APPROVED"]}}
    else:
        query = {}
    return [_ser(l) async for l in leaves_col().find(query).sort("created_at", -1)]


@router.patch("/{leave_id}/action")
async def take_action(leave_id: str, data: LeaveAction,
                      current_user: dict = Depends(require_role("doctor", "admin"))):
    """Doctor or Admin approves/rejects a leave."""
    try:
        leave = await leaves_col().find_one({"_id": ObjectId(leave_id)})
    except Exception:
        raise HTTPException(400, "Invalid leave ID")
    if not leave:
        raise HTTPException(404, "Leave not found")

    role = current_user["role"]
    action = data.action.lower()
    if action not in ["approve", "reject"]:
        raise HTTPException(400, "Action must be 'approve' or 'reject'")

    # Determine new status
    if action == "reject":
        new_status = "REJECTED"
    elif role == "doctor":
        new_status = "DOCTOR_APPROVED"
    else:  # admin
        new_status = "ADMIN_APPROVED"

    log_entry = {
        "action": f"{role.upper()}_{action.upper()}ED",
        "by": current_user["name"], "role": role,
        "notes": data.notes, "timestamp": datetime.utcnow().isoformat()
    }
    update_field = "doctor_action" if role == "doctor" else "admin_action"
    await leaves_col().update_one(
        {"_id": ObjectId(leave_id)},
        {"$set": {
            "status": new_status,
            update_field: {"action": action, "by": current_user["name"], "notes": data.notes,
                           "at": datetime.utcnow().isoformat()},
            "updated_at": datetime.utcnow()
        },
         "$push": {"activity_log": log_entry}}
    )
    return {"leave_id": leave_id, "new_status": new_status, "actioned_by": current_user["name"]}
