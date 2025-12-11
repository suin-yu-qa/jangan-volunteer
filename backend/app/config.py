from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "장안북부 전시대"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/jangan_volunteer"

    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OAuth - Google
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/social/google/callback"

    # OAuth - Kakao
    KAKAO_CLIENT_ID: str = ""
    KAKAO_CLIENT_SECRET: str = ""
    KAKAO_REDIRECT_URI: str = "http://localhost:8000/api/auth/social/kakao/callback"

    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = ""

    # Frontend URL
    FRONTEND_URL: str = "http://localhost:3000"

    # Initial Admin
    INITIAL_ADMIN_EMAIL: str = "ruichela521@gmail.com"
    INITIAL_ADMIN_PASSWORD: str = "DBtndls521!!"
    INITIAL_ADMIN_NAME: str = "관리자"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
