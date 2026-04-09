"""
V2 Campus Healthcare & Insurance Management System
FastAPI entry point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.database import connect_db, close_db
from config.settings import get_settings

settings = get_settings()


async def seed_demo_users():
    """Seed demo users on every startup (safe for mongomock in-memory DB)."""
    from config.database import users_col, pharmacy_col, claims_col
    from core.security import hash_password
    from datetime import datetime, timedelta

    demo_users = [
        {"name": "Rahul Sharma",   "email": "student@demo.com",  "password_hash": hash_password("pass123"), "role": "student",  "student_id": "ST2024001", "is_active": True, "created_at": datetime.utcnow()},
        {"name": "Dr. Smith",      "email": "doctor@demo.com",   "password_hash": hash_password("pass123"), "role": "doctor",   "specialization": "General Physician", "is_active": True, "created_at": datetime.utcnow()},
        {"name": "Dr. Anjali",     "email": "doctor2@demo.com",  "password_hash": hash_password("pass123"), "role": "doctor",   "specialization": "Cardiologist", "is_active": True, "created_at": datetime.utcnow()},
        {"name": "Admin User",     "email": "admin@demo.com",    "password_hash": hash_password("pass123"), "role": "admin",    "department": "Administration", "is_active": True, "created_at": datetime.utcnow()},
        {"name": "Pharmacy Staff", "email": "pharmacy@demo.com", "password_hash": hash_password("pass123"), "role": "pharmacy", "department": "Pharmacy", "is_active": True, "created_at": datetime.utcnow()},
        {"name": "Finance Head",   "email": "finance@demo.com",  "password_hash": hash_password("pass123"), "role": "finance",  "department": "Finance", "is_active": True, "created_at": datetime.utcnow()},
    ]
    for u in demo_users:
        existing = await users_col().find_one({"email": u["email"]})
        if not existing:
            await users_col().insert_one(u)

    # Seed pharmacy inventory if empty
    if await pharmacy_col().count_documents({}) == 0:
        await pharmacy_col().insert_many([
            {"medicine_name": "Paracetamol",  "category": "General",       "current_stock": 500, "min_stock_threshold": 50, "unit": "tablets",  "price_per_unit": 2.50},
            {"medicine_name": "Amoxicillin",  "category": "Antibiotic",    "current_stock": 20,  "min_stock_threshold": 30, "unit": "capsules", "price_per_unit": 12.00},
            {"medicine_name": "Cetirizine",   "category": "Antihistamine", "current_stock": 200, "min_stock_threshold": 20, "unit": "tablets",  "price_per_unit": 5.00},
            {"medicine_name": "Ibuprofen",    "category": "Painkiller",    "current_stock": 100, "min_stock_threshold": 20, "unit": "tablets",  "price_per_unit": 8.00},
        ])

    print("✅ Demo users & inventory ready")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    await seed_demo_users()
    yield
    await close_db()


app = FastAPI(
    title="CampusCare V2 — Comprehensive Healthcare Platform",
    description="Student · Doctor · Admin · Pharmacy · Finance",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list + ["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
from routes import auth, appointments, prescriptions, pharmacy, claims, leaves, dashboard, records

app.include_router(auth.router)
app.include_router(appointments.router)
app.include_router(prescriptions.router)
app.include_router(pharmacy.router)
app.include_router(claims.router)
app.include_router(leaves.router)
app.include_router(dashboard.router)
app.include_router(records.router)


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "version": "2.0.0", "service": "CampusCare V2"}
