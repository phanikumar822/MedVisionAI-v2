from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MedVisionAI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "yoursecretkey"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    DATABASE_URL: str = "sqlite:///./medvision.db"
    MODEL_PATH: str = "../model/dr_efficientnet_b0.pth"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "groq/compound"
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    GROK_BASE_URL: str = "https://api.x.ai/v1"
    CHROMA_DB_DIR: str = "./chroma_db"
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "no-reply@medvisionai.com"
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
