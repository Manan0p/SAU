"""Eligibility engine, reimbursement calculator, fraud detector, workflow — adapted from v1."""
import json
import os
import hashlib
import re
from datetime import datetime, date
from typing import Optional, List

# ── Policy ─────────────────────────────────────────────────────────────────────

def load_policy() -> dict:
    policy_path = os.path.join(os.path.dirname(__file__), "..", "policies", "default_policy.json")
    try:
        with open(policy_path) as f:
            return json.load(f)
    except Exception:
        return {
            "max_annual_limit": 50000, "per_claim_cap": 15000,
            "coverage_percentage": 80, "max_days_to_submit": 30,
            "covered_hospitals": ["Apollo", "AIIMS", "Fortis", "Max", "Medanta", "Manipal",
                                  "Narayana", "Kokilaben", "Lilavati", "Ruby Hall", "CMC",
                                  "Breach Candy", "Sir Ganga Ram", "Safdarjung", "PGIMER"],
            "fraud_thresholds": {"amount_iqr_multiplier": 1.5, "duplicate_window_days": 90}
        }


def evaluate_eligibility(claim_amount: float, hospital_name: str,
                         treatment_date: str, annual_claimed_so_far: float,
                         policy: Optional[dict] = None) -> dict:
    if policy is None:
        policy = load_policy()
    reasons = []
    coverage = policy["coverage_percentage"]

    try:
        td = datetime.fromisoformat(treatment_date).date()
        days_since = (date.today() - td).days
        if days_since > policy["max_days_to_submit"]:
            reasons.append(f"Submission deadline exceeded ({days_since} days since treatment, max {policy['max_days_to_submit']}).")
    except Exception:
        pass

    try:
        from fuzzywuzzy import fuzz
        covered = policy["covered_hospitals"]
        best = max((fuzz.partial_ratio(hospital_name.lower(), h.lower()) for h in covered), default=0)
        if best < 60:
            reasons.append(f"Hospital '{hospital_name}' is not in the covered hospitals list.")
            coverage = 0
    except ImportError:
        if not any(h.lower() in hospital_name.lower() for h in policy["covered_hospitals"]):
            reasons.append(f"Hospital '{hospital_name}' is not in the covered hospitals list.")
            coverage = 0

    if claim_amount > policy["per_claim_cap"]:
        reasons.append(f"Claim amount ₹{claim_amount:.2f} exceeds per-claim cap ₹{policy['per_claim_cap']:.2f}.")

    remaining_limit = policy["max_annual_limit"] - annual_claimed_so_far
    if claim_amount > remaining_limit:
        reasons.append(f"Claim would exceed annual limit. Remaining: ₹{remaining_limit:.2f}.")

    if not reasons:
        elig_status = "ELIGIBLE"
    elif coverage > 0 and len([r for r in reasons if "Hospital" not in r and "deadline" not in r]) == 0:
        elig_status = "PARTIALLY_ELIGIBLE"
    else:
        elig_status = "REJECTED"

    return {"status": elig_status, "reasons": reasons, "coverage_percentage": coverage,
            "evaluated_at": datetime.utcnow().isoformat()}


def calculate_reimbursement(claimed_amount: float, coverage_pct: float,
                            per_claim_cap: float, remaining_annual: float) -> dict:
    base = min(claimed_amount, per_claim_cap)
    reimbursable = round(base * coverage_pct / 100, 2)
    final = round(min(reimbursable, remaining_annual), 2)
    return {"claimed_amount": claimed_amount, "capped_at": base,
            "coverage_percentage": coverage_pct, "reimbursable_amount": reimbursable,
            "deductions": round(reimbursable - final, 2), "final_payable": final,
            "calculated_at": datetime.utcnow().isoformat()}


def analyze_fraud(file_hash: str, student_id: str, claim_amount: float,
                  hospital_name: str, existing_hashes: List[str],
                  hash_to_student_map: dict, historical_amounts: List[float]) -> dict:
    flags = []
    # Duplicate doc
    if file_hash and file_hash in existing_hashes:
        flags.append({"flag_type": "DUPLICATE_DOCUMENT", "severity": "HIGH",
                      "description": "Document has been used in another claim."})
    # Amount anomaly
    if len(historical_amounts) >= 4:
        import numpy as np
        q1, q3 = np.percentile(historical_amounts, [25, 75])
        iqr = q3 - q1
        policy = load_policy()
        upper = q3 + policy["fraud_thresholds"]["amount_iqr_multiplier"] * iqr
        if claim_amount > upper:
            flags.append({"flag_type": "AMOUNT_ANOMALY", "severity": "MEDIUM",
                          "description": f"Claim amount ₹{claim_amount:.2f} is unusually high. Upper fence: ₹{upper:.2f}"})
    # Invalid hospital
    try:
        from fuzzywuzzy import fuzz
        covered = load_policy()["covered_hospitals"]
        best = max((fuzz.partial_ratio(hospital_name.lower(), h.lower()) for h in covered), default=0)
        if best < 40:
            flags.append({"flag_type": "INVALID_HOSPITAL", "severity": "MEDIUM",
                          "description": f"Hospital '{hospital_name}' could not be matched to any known hospital."})
    except ImportError:
        pass

    risk = min(len(flags) * 0.3, 1.0)
    return {"flags": flags, "is_flagged": len(flags) > 0, "risk_score": risk}


# ── Workflow ───────────────────────────────────────────────────────────────────

CLAIM_TRANSITIONS = {
    "SUBMITTED":  {"UNDER_REVIEW": ["admin", "finance"], "REJECTED": ["admin"]},
    "UNDER_REVIEW": {"AUTO_VALIDATED": ["admin"], "APPROVED": ["admin"], "REJECTED": ["admin"]},
    "AUTO_VALIDATED": {"APPROVED": ["admin"], "REJECTED": ["admin"]},
    "APPROVED": {"REIMBURSEMENT_PROCESSED": ["finance"]},
}


def validate_claim_transition(current: str, target: str, role: str):
    allowed = CLAIM_TRANSITIONS.get(current, {}).get(target, [])
    if role not in allowed:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Cannot transition from {current} to {target} as {role}")


def build_log_entry(action: str, performed_by: str, name: str, role: str, notes: Optional[str] = None) -> dict:
    return {"action": action, "performed_by": performed_by, "performed_by_name": name,
            "role": role, "timestamp": datetime.utcnow().isoformat(), "notes": notes}
