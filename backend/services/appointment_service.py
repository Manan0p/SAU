"""Appointment service — slot management, availability, queue."""
from datetime import datetime, timedelta
from typing import Optional, List
from bson import ObjectId
from config.database import appointments_col, users_col


async def get_doctor_slots(doctor_id: str, date_str: str) -> List[dict]:
    """Return available 30-min slots for a doctor on a given date."""
    date = datetime.fromisoformat(date_str)
    start = date.replace(hour=9, minute=0, second=0, microsecond=0)
    end = date.replace(hour=17, minute=0, second=0, microsecond=0)

    # All booked slots for this doctor on this date
    booked_cursor = appointments_col().find({
        "doctor_id": doctor_id,
        "status": {"$nin": ["CANCELLED", "NO_SHOW"]},
        "slot_datetime": {
            "$gte": start.isoformat(),
            "$lt": (date + timedelta(days=1)).replace(hour=0, minute=0).isoformat()
        }
    })
    booked_slots = set()
    async for appt in booked_cursor:
        booked_slots.add(appt["slot_datetime"][:16])

    slots = []
    current = start
    while current < end:
        slot_str = current.isoformat()[:16]
        slots.append({
            "datetime": slot_str,
            "available": slot_str not in booked_slots,
            "display": current.strftime("%I:%M %p"),
        })
        current += timedelta(minutes=30)
    return slots


async def get_queue_token(doctor_id: str, date_str: str) -> int:
    """Return next queue token number for today."""
    date = datetime.fromisoformat(date_str)
    count = await appointments_col().count_documents({
        "doctor_id": doctor_id,
        "slot_datetime": {"$regex": date_str[:10]},
        "status": {"$nin": ["CANCELLED", "NO_SHOW"]},
    })
    return count + 1


async def estimate_wait_time(doctor_id: str, slot_datetime: str) -> int:
    """Estimate wait time in minutes based on current queue."""
    date_prefix = slot_datetime[:10]
    ahead = await appointments_col().count_documents({
        "doctor_id": doctor_id,
        "slot_datetime": {"$lt": slot_datetime, "$gte": date_prefix + "T09:00"},
        "status": {"$in": ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"]},
    })
    return ahead * 15  # 15 min per patient avg
