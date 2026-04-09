"""Claims routes — submit, list, view, approve, reimburse. Adapted from v1 with consolidated service."""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, date
from typing import Optional
from bson import ObjectId
from config.database import claims_col, docs_col, users_col
from core.rbac import get_current_user, require_role
from services.insurance_service import (
    load_policy, evaluate_eligibility, calculate_reimbursement,
    analyze_fraud, validate_claim_transition, build_log_entry
)

router = APIRouter(prefix="/claims", tags=["Claims"])


def _ser(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc


class ClaimCreate:
    pass


from pydantic import BaseModel

class ClaimBody(BaseModel):
    hospital_name: str
    treatment_date: str
    amount: float
    diagnosis: Optional[str] = None
    document_ids: Optional[list] = []


class StatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


@router.post("/", status_code=201)
async def submit_claim(data: ClaimBody, current_user: dict = Depends(require_role("student"))):
    sid = current_user["id"]
    policy = load_policy()

    # Historical amounts for anomaly detection
    amounts = [c["amount"] async for c in claims_col().find({}, {"amount": 1})]
    fraud = analyze_fraud("", sid, data.amount, data.hospital_name, [], {}, amounts)

    # Annual total for eligibility
    year_start = datetime(date.today().year, 1, 1)
    annual_total = sum([c["amount"] async for c in claims_col().find(
        {"student_id": sid, "status": {"$in": ["APPROVED", "REIMBURSEMENT_PROCESSED"]},
         "created_at": {"$gte": year_start}})])

    eligibility = evaluate_eligibility(data.amount, data.hospital_name, data.treatment_date, annual_total, policy)
    initial_log = build_log_entry("CLAIM_SUBMITTED", sid, current_user["name"], "student",
                                  f"₹{data.amount} at {data.hospital_name}")

    claim = {
        "student_id": sid, "student_name": current_user["name"],
        "hospital_name": data.hospital_name, "treatment_date": data.treatment_date,
        "amount": data.amount, "diagnosis": data.diagnosis,
        "document_ids": data.document_ids,
        "status": "SUBMITTED",
        "eligibility": eligibility,
        "reimbursement": None,
        "fraud_flags": fraud["flags"],
        "is_fraud_flagged": fraud["is_flagged"],
        "fraud_risk_score": fraud["risk_score"],
        "activity_log": [initial_log],
        "created_at": datetime.utcnow(), "updated_at": datetime.utcnow(),
    }
    result = await claims_col().insert_one(claim)
    return {"claim_id": str(result.inserted_id), "status": "SUBMITTED",
            "eligibility": eligibility["status"], "is_fraud_flagged": fraud["is_flagged"],
            "message": "Claim submitted. Under review."}


@router.get("/")
async def list_claims(current_user: dict = Depends(get_current_user), status_filter: Optional[str] = None):
    q = {}
    if current_user["role"] == "student":
        q["student_id"] = current_user["id"]
    if status_filter:
        q["status"] = status_filter.upper()
    return [_ser(c) async for c in claims_col().find(q).sort("created_at", -1)]


@router.get("/{claim_id}")
async def get_claim(claim_id: str, current_user: dict = Depends(get_current_user)):
    try:
        claim = await claims_col().find_one({"_id": ObjectId(claim_id)})
    except Exception:
        raise HTTPException(400, "Invalid claim ID")
    if not claim:
        raise HTTPException(404, "Not found")
    if current_user["role"] == "student" and claim["student_id"] != current_user["id"]:
        raise HTTPException(403, "Access denied")
    return _ser(claim)


@router.patch("/{claim_id}/status")
async def update_status(claim_id: str, update: StatusUpdate,
                        current_user: dict = Depends(require_role("admin", "finance"))):
    try:
        claim = await claims_col().find_one({"_id": ObjectId(claim_id)})
    except Exception:
        raise HTTPException(400, "Invalid ID")
    if not claim:
        raise HTTPException(404, "Not found")
    validate_claim_transition(claim["status"], update.status, current_user["role"])
    log = build_log_entry(f"STATUS:{claim['status']}→{update.status}",
                          current_user["id"], current_user["name"], current_user["role"], update.notes)
    await claims_col().update_one({"_id": ObjectId(claim_id)},
        {"$set": {"status": update.status, "updated_at": datetime.utcnow()}, "$push": {"activity_log": log}})
    return {"claim_id": claim_id, "new_status": update.status}


@router.post("/{claim_id}/calculate")
async def calculate(claim_id: str, current_user: dict = Depends(require_role("admin", "finance"))):
    """Calculate reimbursement for an approved-or-validated claim."""
    try:
        claim = await claims_col().find_one({"_id": ObjectId(claim_id)})
    except Exception:
        raise HTTPException(400, "Invalid ID")
    if not claim:
        raise HTTPException(404, "Not found")
    policy = load_policy()
    eligibility = claim.get("eligibility", {})
    coverage = eligibility.get("coverage_percentage", policy["coverage_percentage"])
    year_start = datetime(date.today().year, 1, 1)
    annual_total = sum([c["amount"] async for c in claims_col().find(
        {"student_id": claim["student_id"], "status": "REIMBURSEMENT_PROCESSED", "created_at": {"$gte": year_start}})])
    remaining = policy["max_annual_limit"] - annual_total
    reimb = calculate_reimbursement(claim["amount"], coverage, policy["per_claim_cap"], remaining)
    await claims_col().update_one({"_id": ObjectId(claim_id)}, {"$set": {"reimbursement": reimb}})
    return reimb


@router.patch("/{claim_id}/action")
async def admin_action(claim_id: str, action: str, notes: Optional[str] = None,
                       current_user: dict = Depends(require_role("admin"))):
    """Admin approve or reject a claim."""
    try:
        claim = await claims_col().find_one({"_id": ObjectId(claim_id)})
    except Exception:
        raise HTTPException(400, "Invalid ID")
    if not claim:
        raise HTTPException(404, "Not found")
    if action not in ["approve", "reject"]:
        raise HTTPException(400, "Action must be 'approve' or 'reject'")
    target = "APPROVED" if action == "approve" else "REJECTED"
    validate_claim_transition(claim["status"], target, "admin")
    log = build_log_entry(f"ADMIN_{action.upper()}ED", current_user["id"], current_user["name"], "admin", notes)
    await claims_col().update_one({"_id": ObjectId(claim_id)},
        {"$set": {"status": target, "updated_at": datetime.utcnow()}, "$push": {"activity_log": log}})
    return {"claim_id": claim_id, "new_status": target}


@router.post("/{claim_id}/process")
async def process_payment(claim_id: str, current_user: dict = Depends(require_role("finance"))):
    """Finance marks reimbursement as processed."""
    try:
        claim = await claims_col().find_one({"_id": ObjectId(claim_id)})
    except Exception:
        raise HTTPException(400, "Invalid ID")
    if not claim or claim["status"] != "APPROVED":
        raise HTTPException(400, "Claim must be APPROVED before processing payment")
    log = build_log_entry("PAYMENT_PROCESSED", current_user["id"], current_user["name"], "finance")
    await claims_col().update_one({"_id": ObjectId(claim_id)},
        {"$set": {"status": "REIMBURSEMENT_PROCESSED", "updated_at": datetime.utcnow()}, "$push": {"activity_log": log}})
    return {"claim_id": claim_id, "status": "REIMBURSEMENT_PROCESSED",
            "final_payable": claim.get("reimbursement", {}).get("final_payable", 0)}
