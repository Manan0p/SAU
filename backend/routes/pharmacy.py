"""Pharmacy routes — inventory, dispense queue, stock management."""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime
from typing import Optional
from bson import ObjectId
from config.database import pharmacy_col, dispense_col, prescriptions_col
from core.rbac import get_current_user, require_role
from models.pharmacy import PharmacyItem, DispenseRequest, PharmacyItemUpdate
from services.pharmacy_service import get_low_stock_items, check_medicine_availability, dispense_medicines

router = APIRouter(prefix="/pharmacy", tags=["Pharmacy"])


def _ser(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/inventory")
async def list_inventory(current_user: dict = Depends(require_role("pharmacy", "doctor", "admin"))):
    """List all pharmacy inventory items."""
    items = [_ser(i) async for i in pharmacy_col().find({}).sort("medicine_name", 1)]
    return items


@router.post("/inventory", status_code=201)
async def add_inventory_item(item: PharmacyItem,
                              current_user: dict = Depends(require_role("pharmacy", "admin"))):
    """Add a new medicine to inventory."""
    existing = await pharmacy_col().find_one({"medicine_name": {"$regex": f"^{item.medicine_name}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=409, detail=f"Medicine '{item.medicine_name}' already exists.")
    doc = item.dict()
    doc["created_at"] = datetime.utcnow()
    doc["added_by"] = current_user["name"]
    result = await pharmacy_col().insert_one(doc)
    return {"medicine_id": str(result.inserted_id), "message": f"'{item.medicine_name}' added to inventory."}


@router.patch("/inventory/{item_id}")
async def update_inventory(item_id: str, update: PharmacyItemUpdate,
                           current_user: dict = Depends(require_role("pharmacy", "admin"))):
    """Update stock, threshold, expiry, or price."""
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    await pharmacy_col().update_one({"_id": ObjectId(item_id)}, {"$set": update_data})
    return {"message": "Inventory updated.", "item_id": item_id}


@router.get("/low-stock")
async def low_stock_alerts(current_user: dict = Depends(require_role("pharmacy", "admin"))):
    """Get medicines below their minimum stock threshold."""
    items = await get_low_stock_items()
    return {"low_stock_count": len(items), "items": items,
            "alert": len(items) > 0}


@router.get("/dispense-queue")
async def dispense_queue(current_user: dict = Depends(require_role("pharmacy"))):
    """Get all active (undispensed) prescriptions for pharmacy."""
    rxs = [_ser(rx) async for rx in prescriptions_col().find({"is_dispensed": False, "status": "ACTIVE"}).sort("created_at", 1)]
    return {"count": len(rxs), "prescriptions": rxs}


@router.post("/dispense")
async def dispense(req: DispenseRequest, current_user: dict = Depends(require_role("pharmacy"))):
    """Dispense medicines for a prescription."""
    rx = await prescriptions_col().find_one({"_id": ObjectId(req.prescription_id)})
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
    if rx["is_dispensed"]:
        raise HTTPException(status_code=409, detail="Already dispensed")

    result = await dispense_medicines(req.medicines_dispensed)

    # Log dispense event
    log = {
        "prescription_id": req.prescription_id,
        "patient_id": req.patient_id,
        "dispensed_by": current_user["name"],
        "dispensed_by_id": current_user["id"],
        "medicines": req.medicines_dispensed,
        "dispense_result": result,
        "notes": req.notes,
        "dispensed_at": datetime.utcnow(),
    }
    await dispense_col().insert_one(log)

    # Mark prescription dispensed
    await prescriptions_col().update_one(
        {"_id": ObjectId(req.prescription_id)},
        {"$set": {"is_dispensed": True, "dispensed_at": datetime.utcnow().isoformat(),
                  "dispensed_by": current_user["name"], "status": "DISPENSED"}}
    )
    return {"message": "Medicines dispensed.", "result": result}


@router.get("/check/{medicine_name}")
async def check_stock(medicine_name: str, quantity: int = Query(1),
                      current_user: dict = Depends(get_current_user)):
    """Check if a medicine is available in sufficient quantity."""
    return await check_medicine_availability(medicine_name, quantity)
