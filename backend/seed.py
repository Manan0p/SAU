"""
Seed script for V2 CampusCare — populates demp users, inventory, and initial claims.
"""
import asyncio
from datetime import datetime, timedelta
from config.database import connect_db, users_col, pharmacy_col, claims_col, appointments_col, close_db
from core.security import hash_password

async def seed():
    await connect_db()
    
    # 1. Clear existing data
    await users_col().delete_many({})
    await pharmacy_col().delete_many({})
    await claims_col().delete_many({})
    await appointments_col().delete_many({})
    
    # 2. Users
    users = [
        {"name": "Rahul Sharma", "email": "student@demo.com", "password_hash": hash_password("pass123"), "role": "student", "student_id": "ST2024001"},
        {"name": "Dr. Smith", "email": "doctor@demo.com", "password_hash": hash_password("pass123"), "role": "doctor", "specialization": "General Physician"},
        {"name": "Dr. Anjali", "email": "doctor2@demo.com", "password_hash": hash_password("pass123"), "role": "doctor", "specialization": "Cardiologist"},
        {"name": "Admin User", "email": "admin@demo.com", "password_hash": hash_password("pass123"), "role": "admin", "department": "Administration"},
        {"name": "Pharmacy Staff", "email": "pharmacy@demo.com", "password_hash": hash_password("pass123"), "role": "pharmacy", "department": "Pharmacy"},
        {"name": "Finance Head", "email": "finance@demo.com", "password_hash": hash_password("pass123"), "role": "finance", "department": "Finance"},
    ]
    await users_col().insert_many(users)
    print("✅ Users seeded")

    # 3. Pharmacy Inventory
    inventory = [
        {"medicine_name": "Paracetamol", "category": "General", "current_stock": 500, "min_stock_threshold": 50, "unit": "tablets", "price_per_unit": 2.50},
        {"medicine_name": "Amoxicillin", "category": "Antibiotic", "current_stock": 20, "min_stock_threshold": 30, "unit": "capsules", "price_per_unit": 12.00}, # Low stock
        {"medicine_name": "Cetirizine", "category": "Antihistamine", "current_stock": 200, "min_stock_threshold": 20, "unit": "tablets", "price_per_unit": 5.00},
        {"medicine_name": "Ibuprofen", "category": "Painkiller", "current_stock": 100, "min_stock_threshold": 20, "unit": "tablets", "price_per_unit": 8.00},
    ]
    await pharmacy_col().insert_many(inventory)
    print("✅ Pharmacy inventory seeded")

    # 4. Initial Claims for Demo
    student = await users_col().find_one({"email": "student@demo.com"})
    claims = [
        {
            "student_id": str(student["_id"]), "student_name": student["name"],
            "hospital_name": "Apollo Hospital", "treatment_date": (datetime.now() - timedelta(days=5)).isoformat()[:10],
            "amount": 12000.0, "diagnosis": "Severe Viral Fever", "status": "APPROVED",
            "is_fraud_flagged": False, "fraud_risk_score": 0.05,
            "reimbursement": {"final_payable": 9600.0, "calculated_at": datetime.now().isoformat()},
            "created_at": datetime.now() - timedelta(days=4)
        },
        {
            "student_id": str(student["_id"]), "student_name": student["name"],
            "hospital_name": "City Clinic", "treatment_date": datetime.now().isoformat()[:10],
            "amount": 4500.0, "diagnosis": "Sprained Ankle", "status": "SUBMITTED",
            "is_fraud_flagged": False, "fraud_risk_score": 0.1,
            "created_at": datetime.now()
        }
    ]
    await claims_col().insert_many(claims)
    print("✅ Initial claims seeded")
    
    await close_db()
    print("🚀 Seed complete!")

if __name__ == "__main__":
    asyncio.run(seed())
