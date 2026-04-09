"""Auth routes — register, login, /me for all 5 roles."""
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from bson import ObjectId
from config.database import users_col
from core.auth import create_access_token
from core.security import hash_password, verify_password
from core.rbac import get_current_user
from models.user import UserCreate, UserLogin

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=201)
async def register(data: UserCreate):
    if await users_col().find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="A user with this email already exists.")
    user = {
        "name": data.name, "email": data.email,
        "password_hash": hash_password(data.password),
        "role": data.role.value,
        "student_id": data.student_id,
        "specialization": data.specialization,
        "department": data.department,
        "employee_id": data.employee_id,
        "created_at": datetime.utcnow(),
        "is_active": True,
    }
    result = await users_col().insert_one(user)
    uid = str(result.inserted_id)
    token = create_access_token(uid, data.role.value, data.email)
    return {"message": "Registered successfully.", "user_id": uid,
            "access_token": token, "token_type": "bearer",
            "role": data.role.value, "name": data.name}


@router.post("/login")
async def login(data: UserLogin):
    user = await users_col().find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    uid = str(user["_id"])
    token = create_access_token(uid, user["role"], data.email)
    return {"access_token": token, "token_type": "bearer", "user_id": uid,
            "name": user["name"], "role": user["role"],
            "specialization": user.get("specialization"),
            "student_id": user.get("student_id")}


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return current_user
