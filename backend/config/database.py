from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config.settings import get_settings

settings = get_settings()

_client = None
_db = None
_using_mock = False


async def connect_db():
    global _client, _db, _using_mock
    try:
        real_client = AsyncIOMotorClient(settings.mongo_uri, serverSelectionTimeoutMS=2000)
        await real_client.admin.command("ping")
        _client = real_client
        _db = _client[settings.mongo_db_name]
        _using_mock = False
        # Indexes
        await _db.users.create_index("email", unique=True)
        await _db.appointments.create_index([("doctor_id", 1), ("slot_datetime", 1)])
        await _db.appointments.create_index("student_id")
        await _db.prescriptions.create_index("patient_id")
        await _db.prescriptions.create_index("appointment_id")
        await _db.claims.create_index("student_id")
        await _db.medical_leaves.create_index("student_id")
        await _db.pharmacy_inventory.create_index("medicine_name", unique=True)
        print(f"✅ Connected to MongoDB: {settings.mongo_db_name}")
    except Exception:
        try:
            from mongomock_motor import AsyncMongoMockClient
            _client = AsyncMongoMockClient()
            _db = _client[settings.mongo_db_name]
            _using_mock = True
            print("✅ Using in-memory MongoDB (mongomock). Data resets on restart.")
        except ImportError:
            raise RuntimeError("No database available — run: pip install mongomock-motor")


async def close_db():
    global _client
    if _client and not _using_mock:
        _client.close()


def get_db() -> Optional[AsyncIOMotorDatabase]:
    if _db is None:
        raise RuntimeError("Database not connected.")
    return _db


def users_col():         return get_db().users
def appointments_col():  return get_db().appointments
def records_col():       return get_db().medical_records
def prescriptions_col(): return get_db().prescriptions
def pharmacy_col():      return get_db().pharmacy_inventory
def dispense_col():      return get_db().dispense_log
def claims_col():        return get_db().claims
def leaves_col():        return get_db().medical_leaves
def docs_col():          return get_db().documents
def logs_col():          return get_db().activity_logs
