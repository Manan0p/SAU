from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    student = "student"
    doctor = "doctor"
    admin = "admin"
    pharmacy = "pharmacy"
    finance = "finance"


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.student
    student_id: Optional[str] = None
    specialization: Optional[str] = None   # For doctors
    department: Optional[str] = None       # For admin/staff
    employee_id: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    student_id: Optional[str] = None
    specialization: Optional[str] = None
    department: Optional[str] = None
