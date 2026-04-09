from typing import Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.auth import decode_token
from config.database import users_col
from bson import ObjectId

bearer = HTTPBearer()

ROLES = ["student", "doctor", "admin", "pharmacy", "finance"]


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    try:
        user = await users_col().find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = None
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "specialization": user.get("specialization"),
        "department": user.get("department"),
    }


def require_role(*roles: str):
    async def guard(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user["role"] not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {list(roles)}"
            )
        return current_user
    return guard
