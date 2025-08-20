"""
Configurações do SACSMAX Backend
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Configurações básicas
    app_name: str = "SACSMAX"
    version: str = "2.1.0"
    environment: str = "development"
    
    # Configurações do banco de dados
    database_url: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/sacsmax")
    
    # Configurações do Redis (para Celery)
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Configurações de segurança
    secret_key: str = os.getenv("SECRET_KEY", "sacsmax-secret-key-change-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Configurações do WhatsApp
    whatsapp_session_path: str = "./whatsapp_sessions"
    whatsapp_headless: bool = True
    whatsapp_timeout: int = 30
    
    # Configurações de upload
    upload_folder: str = "./uploads"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_extensions: list = [".xlsx", ".xls", ".csv"]
    
    # Configurações de logging
    log_level: str = "INFO"
    log_file: str = "./logs/sacsmax.log"
    
    # Configurações do Railway
    port: int = int(os.getenv("PORT", 8000))
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Instância global das configurações
settings = Settings()

