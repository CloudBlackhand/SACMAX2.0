"""
Serviço para processamento de arquivos Excel
"""

import pandas as pd
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import UploadFile, HTTPException
import logging
from datetime import datetime

from app.core.config import settings
from app.core.database import SessionLocal, Contact, UploadedFile

logger = logging.getLogger(__name__)

class ExcelService:
    def __init__(self):
        self.upload_folder = Path(settings.upload_folder)
        self.upload_folder.mkdir(exist_ok=True)
        
    async def initialize(self):
        """Inicializar o serviço"""
        logger.info("Inicializando ExcelService...")
        
    async def cleanup(self):
        """Limpeza do serviço"""
        logger.info("Limpando ExcelService...")
    
    def validate_file(self, file: UploadFile) -> bool:
        """Validar arquivo de upload"""
        # Verificar extensão
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in settings.allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de arquivo não suportado. Use: {', '.join(settings.allowed_extensions)}"
            )
        
        # Verificar tamanho
        if file.size and file.size > settings.max_file_size:
            raise HTTPException(
                status_code=400,
                detail=f"Arquivo muito grande. Máximo: {settings.max_file_size // (1024*1024)}MB"
            )
        
        return True
    
    async def save_uploaded_file(self, file: UploadFile) -> str:
        """Salvar arquivo no sistema"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        file_path = self.upload_folder / filename
        
        try:
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            return str(file_path)
        except Exception as e:
            logger.error(f"Erro ao salvar arquivo: {e}")
            raise HTTPException(status_code=500, detail="Erro ao salvar arquivo")
    
    def read_excel_file(self, file_path: str) -> pd.DataFrame:
        """Ler arquivo Excel e retornar DataFrame"""
        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path, engine='openpyxl')
            
            return df
        except Exception as e:
            logger.error(f"Erro ao ler arquivo Excel: {e}")
            raise HTTPException(status_code=500, detail="Erro ao ler arquivo Excel")
    
    def extract_contacts_from_dataframe(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Extrair contatos do DataFrame"""
        contacts = []
        
        # Mapear colunas comuns
        column_mapping = {
            'nome': 'name',
            'name': 'name',
            'telefone': 'phone',
            'phone': 'phone',
            'celular': 'phone',
            'email': 'email',
            'e-mail': 'email',
            'empresa': 'company',
            'company': 'company',
            'cargo': 'position',
            'position': 'position',
            'função': 'position'
        }
        
        # Normalizar nomes das colunas
        df.columns = df.columns.str.lower().str.strip()
        
        # Renomear colunas baseado no mapeamento
        for col in df.columns:
            if col in column_mapping:
                df = df.rename(columns={col: column_mapping[col]})
        
        # Processar cada linha
        for index, row in df.iterrows():
            contact = {}
            
            # Extrair dados básicos
            if 'name' in df.columns:
                contact['name'] = str(row['name']).strip() if pd.notna(row['name']) else ''
            
            if 'phone' in df.columns:
                phone = str(row['phone']).strip() if pd.notna(row['phone']) else ''
                # Limpar telefone (remover caracteres especiais)
                phone = ''.join(filter(str.isdigit, phone))
                contact['phone'] = phone
            
            if 'email' in df.columns:
                contact['email'] = str(row['email']).strip() if pd.notna(row['email']) else ''
            
            if 'company' in df.columns:
                contact['company'] = str(row['company']).strip() if pd.notna(row['company']) else ''
            
            if 'position' in df.columns:
                contact['position'] = str(row['position']).strip() if pd.notna(row['position']) else ''
            
            # Validar contato (deve ter pelo menos nome ou telefone)
            if contact.get('name') or contact.get('phone'):
                contacts.append(contact)
        
        return contacts
    
    async def process_excel_file(self, file: UploadFile) -> Dict[str, Any]:
        """Processar arquivo Excel completo"""
        # Validar arquivo
        self.validate_file(file)
        
        # Salvar arquivo
        file_path = await self.save_uploaded_file(file)
        
        # Ler arquivo
        df = self.read_excel_file(file_path)
        
        # Extrair contatos
        contacts = self.extract_contacts_from_dataframe(df)
        
        # Salvar no banco
        db = SessionLocal()
        try:
            # Salvar arquivo
            uploaded_file = UploadedFile(
                filename=Path(file_path).name,
                original_filename=file.filename,
                file_path=file_path,
                file_size=file.size or 0,
                file_type=Path(file.filename).suffix,
                contacts_count=len(contacts),
                processed=True
            )
            db.add(uploaded_file)
            db.commit()
            db.refresh(uploaded_file)
            
            # Salvar contatos
            for contact_data in contacts:
                contact = Contact(
                    name=contact_data.get('name', ''),
                    phone=contact_data.get('phone', ''),
                    email=contact_data.get('email', ''),
                    company=contact_data.get('company', ''),
                    position=contact_data.get('position', ''),
                    source_file=uploaded_file.filename,
                    status='pending'
                )
                db.add(contact)
            
            db.commit()
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erro ao salvar no banco: {e}")
            raise HTTPException(status_code=500, detail="Erro ao processar arquivo")
        finally:
            db.close()
        
        return {
            "message": "Arquivo processado com sucesso",
            "filename": file.filename,
            "contacts_count": len(contacts),
            "contacts": contacts[:10],  # Retornar apenas os primeiros 10 para preview
            "file_id": uploaded_file.id
        }
    
    async def get_uploaded_files(self) -> List[Dict[str, Any]]:
        """Listar arquivos enviados"""
        db = SessionLocal()
        try:
            files = db.query(UploadedFile).order_by(UploadedFile.created_at.desc()).all()
            return [
                {
                    "id": file.id,
                    "filename": file.original_filename,
                    "file_size": file.file_size,
                    "contacts_count": file.contacts_count,
                    "processed": file.processed,
                    "created_at": file.created_at.isoformat()
                }
                for file in files
            ]
        finally:
            db.close()
    
    async def get_contacts_from_file(self, file_id: int) -> List[Dict[str, Any]]:
        """Obter contatos de um arquivo específico"""
        db = SessionLocal()
        try:
            file = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
            if not file:
                raise HTTPException(status_code=404, detail="Arquivo não encontrado")
            
            contacts = db.query(Contact).filter(Contact.source_file == file.filename).all()
            return [
                {
                    "id": contact.id,
                    "name": contact.name,
                    "phone": contact.phone,
                    "email": contact.email,
                    "company": contact.company,
                    "position": contact.position,
                    "status": contact.status,
                    "created_at": contact.created_at.isoformat()
                }
                for contact in contacts
            ]
        finally:
            db.close()

