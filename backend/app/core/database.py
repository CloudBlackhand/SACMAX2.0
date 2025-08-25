"""
Configuração do banco de dados SACSMAX
"""

import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func
from datetime import datetime

# Configurações do banco
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/sacsmax")

# Criar engine do banco
try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False
    )
except Exception as e:
    print(f"⚠️ Erro ao criar engine do banco: {e}")
    engine = None

# Criar sessão
if engine:
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    SessionLocal = None

# Base para modelos
Base = declarative_base()

# Modelos do banco de dados
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Contact(Base):
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    phone = Column(String(20), index=True)
    email = Column(String(100))
    company = Column(String(100))
    position = Column(String(100))
    source_file = Column(String(255))
    status = Column(String(20), default="pending")  # pending, sent, delivered, failed
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, index=True)
    content = Column(Text)
    message_type = Column(String(20))  # text, media, template
    status = Column(String(20), default="pending")  # pending, sent, delivered, failed
    whatsapp_message_id = Column(String(100))
    sent_at = Column(DateTime)
    delivered_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())

class FeedbackTemplate(Base):
    __tablename__ = "feedback_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    content = Column(Text)
    variables = Column(JSON)  # Variáveis dinâmicas do template
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class WhatsAppSession(Base):
    __tablename__ = "whatsapp_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, index=True)
    phone_number = Column(String(20))
    status = Column(String(20), default="disconnected")  # disconnected, connecting, connected
    qr_code = Column(Text)
    last_activity = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class UploadedFile(Base):
    __tablename__ = "uploaded_files"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255))
    original_filename = Column(String(255))
    file_path = Column(String(500))
    file_size = Column(Integer)
    file_type = Column(String(50))
    contacts_count = Column(Integer, default=0)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

# Função para obter sessão do banco
def get_db():
    if not SessionLocal:
        raise Exception("Database not configured")
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

