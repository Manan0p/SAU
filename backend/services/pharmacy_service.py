"""Pharmacy service — inventory management and dispensing."""
from typing import List
from config.database import pharmacy_col, prescriptions_col
from bson import ObjectId


async def get_low_stock_items(threshold_multiplier: float = 1.0) -> List[dict]:
    """Return medicines below their minimum stock threshold."""
    items = []
    async for item in pharmacy_col().find({}):
        threshold = item.get("min_stock_threshold", 20)
        if item.get("current_stock", 0) <= threshold * threshold_multiplier:
            item["id"] = str(item.pop("_id"))
            items.append(item)
    return items


async def check_medicine_availability(medicine_name: str, required_qty: int) -> dict:
    """Check if a medicine is available in sufficient quantity."""
    item = await pharmacy_col().find_one({"medicine_name": {"$regex": medicine_name, "$options": "i"}})
    if not item:
        return {"available": False, "reason": "Medicine not found in inventory", "stock": 0}
    stock = item.get("current_stock", 0)
    if stock < required_qty:
        return {"available": False, "reason": f"Insufficient stock ({stock} available, {required_qty} needed)", "stock": stock}
    return {"available": True, "stock": stock, "medicine_name": item["medicine_name"]}


async def dispense_medicines(medicines: list) -> dict:
    """Deduct stock for dispensed medicines. Returns success/failure per item."""
    results = []
    for med in medicines:
        name = med.get("name") or med.get("medicine_name", "")
        qty = int(med.get("quantity", 1))
        item = await pharmacy_col().find_one({"medicine_name": {"$regex": name, "$options": "i"}})
        if not item:
            results.append({"name": name, "success": False, "reason": "Not found"})
            continue
        current = item.get("current_stock", 0)
        if current < qty:
            results.append({"name": name, "success": False, "reason": f"Insufficient stock ({current} left)"})
            continue
        await pharmacy_col().update_one(
            {"_id": item["_id"]},
            {"$inc": {"current_stock": -qty}}
        )
        results.append({"name": name, "success": True, "dispensed": qty, "remaining_stock": current - qty})
    return {"results": results, "all_success": all(r["success"] for r in results)}
