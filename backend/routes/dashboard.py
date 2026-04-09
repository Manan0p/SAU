"""Dashboard routes — role-specific summary stats."""
from fastapi import APIRouter, Depends
from datetime import datetime, date, timedelta
from config.database import (appointments_col, claims_col, prescriptions_col,
                              pharmacy_col, leaves_col, users_col)
from core.rbac import get_current_user, require_role

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/student")
async def student_dashboard(current_user: dict = Depends(require_role("student"))):
    sid = current_user["id"]
    today = date.today().isoformat()
    year_start = datetime(date.today().year, 1, 1)

    # Upcoming appointments
    upcoming = [a async for a in appointments_col().find(
        {"student_id": sid, "slot_datetime": {"$gte": today}, "status": {"$in": ["SCHEDULED", "CONFIRMED"]}}).limit(5)]
    for a in upcoming: a["id"] = str(a.pop("_id"))

    # Claims
    claims = [c async for c in claims_col().find({"student_id": sid})]
    status_counts = {}
    for c in claims:
        status_counts[c["status"]] = status_counts.get(c["status"], 0) + 1

    annual_claimed = sum(c["amount"] for c in claims if c.get("created_at", datetime.min) >= year_start)
    annual_reimbursed = sum(c.get("reimbursement", {}).get("final_payable", 0) for c in claims
                            if c.get("status") == "REIMBURSEMENT_PROCESSED" and c.get("created_at", datetime.min) >= year_start)

    # Active prescriptions
    rx_count = await prescriptions_col().count_documents({"patient_id": sid, "is_dispensed": False, "status": "ACTIVE"})

    # Leaves
    leaves = [l async for l in leaves_col().find({"student_id": sid}).limit(5)]
    for l in leaves: l["id"] = str(l.pop("_id"))

    recent_claims = claims[-5:]
    for c in recent_claims: c["id"] = str(c.pop("_id"))

    return {
        "student_name": current_user["name"],
        "upcoming_appointments": upcoming,
        "upcoming_count": len(upcoming),
        "status_counts": status_counts,
        "annual_claimed": annual_claimed,
        "annual_reimbursed": annual_reimbursed,
        "active_prescriptions": rx_count,
        "recent_claims": recent_claims,
        "recent_leaves": leaves,
    }


@router.get("/doctor")
async def doctor_dashboard(current_user: dict = Depends(require_role("doctor"))):
    did = current_user["id"]
    today = date.today().isoformat()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()

    # Today's schedule
    schedule = [a async for a in appointments_col().find(
        {"doctor_id": did, "slot_datetime": {"$gte": today, "$lt": tomorrow},
         "status": {"$nin": ["CANCELLED"]}}).sort("slot_datetime", 1)]
    for a in schedule: a["id"] = str(a.pop("_id"))

    # Weekly stats
    week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
    total_this_week = await appointments_col().count_documents(
        {"doctor_id": did, "slot_datetime": {"$gte": week_ago}})
    completed = await appointments_col().count_documents({"doctor_id": did, "status": "COMPLETED"})

    # Pending prescriptions to write
    pending_consults = await appointments_col().count_documents(
        {"doctor_id": did, "status": "COMPLETED", "consultation_notes": None})

    # Unique patients
    all_appts = [a async for a in appointments_col().find({"doctor_id": did}, {"student_id": 1})]
    unique_patients = len(set(a["student_id"] for a in all_appts))

    # Pending leaves to review
    pending_leaves = await leaves_col().count_documents({"status": "PENDING"})

    return {
        "doctor_name": current_user["name"],
        "specialization": current_user.get("specialization", "General"),
        "today_schedule": schedule,
        "appointments_today": len(schedule),
        "appointments_this_week": total_this_week,
        "completed_all_time": completed,
        "pending_consult_notes": pending_consults,
        "unique_patients": unique_patients,
        "pending_leave_reviews": pending_leaves,
    }


@router.get("/admin")
async def admin_dashboard(current_user: dict = Depends(require_role("admin"))):
    total_claims = await claims_col().count_documents({})
    pending_claims = await claims_col().count_documents({"status": {"$in": ["SUBMITTED", "UNDER_REVIEW"]}})
    fraud_flagged = await claims_col().count_documents({"is_fraud_flagged": True})
    approved = await claims_col().count_documents({"status": "APPROVED"})
    total_users = await users_col().count_documents({})
    total_appts = await appointments_col().count_documents({})
    pending_leaves = await leaves_col().count_documents({"status": {"$in": ["PENDING", "DOCTOR_APPROVED"]}})

    # Recent submissions
    recent = [c async for c in claims_col().find({}).sort("created_at", -1).limit(10)]
    for c in recent: c["id"] = str(c.pop("_id"))

    # Flagged claims
    flagged = [c async for c in claims_col().find({"is_fraud_flagged": True}).sort("fraud_risk_score", -1).limit(5)]
    for c in flagged: c["id"] = str(c.pop("_id"))

    return {
        "total_claims": total_claims, "pending_claims": pending_claims,
        "fraud_flagged": fraud_flagged, "approved": approved,
        "total_users": total_users, "total_appointments": total_appts,
        "pending_leaves": pending_leaves,
        "recent_submissions": recent,
        "flagged_claims": flagged,
    }


@router.get("/pharmacy")
async def pharmacy_dashboard(current_user: dict = Depends(require_role("pharmacy"))):
    total_items = await pharmacy_col().count_documents({})
    dispense_queue = await prescriptions_col().count_documents({"is_dispensed": False, "status": "ACTIVE"})

    # Low stock
    low_stock_items = []
    async for item in pharmacy_col().find({}):
        if item.get("current_stock", 0) <= item.get("min_stock_threshold", 20):
            item["id"] = str(item.pop("_id"))
            low_stock_items.append(item)

    # Recently dispensed
    from config.database import dispense_col
    recent_dispenses = [d async for d in dispense_col().find({}).sort("dispensed_at", -1).limit(10)]
    for d in recent_dispenses: d["id"] = str(d.pop("_id"))

    return {
        "total_inventory_items": total_items,
        "dispense_queue_count": dispense_queue,
        "low_stock_count": len(low_stock_items),
        "low_stock_items": low_stock_items,
        "recent_dispenses": recent_dispenses,
    }


@router.get("/finance")
async def finance_dashboard(current_user: dict = Depends(require_role("finance"))):
    pending = [c async for c in claims_col().find({"status": "APPROVED"})]
    pending_total = sum(c.get("reimbursement", {}).get("final_payable", 0) for c in pending)
    for c in pending: c["id"] = str(c.pop("_id"))

    processed = [c async for c in claims_col().find({"status": "REIMBURSEMENT_PROCESSED"})]
    processed_total = sum(c.get("reimbursement", {}).get("final_payable", 0) for c in processed)

    return {
        "pending_payment_count": len(pending),
        "pending_payment_total": pending_total,
        "pending_claims": pending[:10],
        "processed_count": len(processed),
        "processed_total": processed_total,
    }
