from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "campus_healthcare_v2"
    jwt_secret: str = "v2-campus-healthcare-super-secret-key-2024"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24
    encryption_key: str = "campushealthcarev232bytekey123456"
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 10
    allowed_origins: str = "http://localhost:5174,http://localhost:3000"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
