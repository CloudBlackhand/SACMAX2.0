"""
Serviço para processamento de arquivos Excel
"""

import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import UploadFile, HTTPException
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ExcelService:
    def __init__(self):
        self.upload_folder = Path("./uploads")
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
        allowed_extensions = [".xlsx", ".xls", ".csv"]
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de arquivo não suportado. Use: {', '.join(allowed_extensions)}"
            )
        
        # Verificar tamanho
        max_file_size = 10 * 1024 * 1024  # 10MB
        if file.size and file.size > max_file_size:
            raise HTTPException(
                status_code=400,
                detail=f"Arquivo muito grande. Máximo: {max_file_size // (1024*1024)}MB"
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
    
    def read_excel_file(self, file_path: str) -> List[Dict[str, Any]]:
        """Ler arquivo Excel e retornar dados simulados"""
        try:
            # Simular leitura de arquivo Excel
            # Em produção, usaria pandas para ler o arquivo real
            contacts = [
                {
                    "name": "João Silva",
                    "phone": "5511999999999",
                    "email": "joao@exemplo.com",
                    "company": "Empresa A",
                    "position": "Gerente"
                },
                {
                    "name": "Maria Santos",
                    "phone": "5511888888888",
                    "email": "maria@exemplo.com",
                    "company": "Empresa B",
                    "position": "Diretora"
                },
                {
                    "name": "Pedro Costa",
                    "phone": "5511777777777",
                    "email": "pedro@exemplo.com",
                    "company": "Empresa C",
                    "position": "Analista"
                }
            ]
            
            return contacts
        except Exception as e:
            logger.error(f"Erro ao ler arquivo Excel: {e}")
            raise HTTPException(status_code=500, detail="Erro ao ler arquivo Excel")
    
    async def process_excel_file(self, file: UploadFile) -> Dict[str, Any]:
        """Processar arquivo Excel completo"""
        # Validar arquivo
        self.validate_file(file)
        
        # Salvar arquivo
        file_path = await self.save_uploaded_file(file)
        
        # Ler arquivo (simulado)
        contacts = self.read_excel_file(file_path)
        
        return {
            "message": "Arquivo processado com sucesso (modo simulação)",
            "filename": file.filename,
            "contacts_count": len(contacts),
            "contacts": contacts,
            "file_id": 1
        }
    
    async def get_uploaded_files(self) -> List[Dict[str, Any]]:
        """Listar arquivos enviados"""
        try:
            # Simular lista de arquivos
            return [
                {
                    "id": 1,
                    "filename": "exemplo.xlsx",
                    "file_size": 1024,
                    "contacts_count": 3,
                    "processed": True,
                    "created_at": datetime.now().isoformat()
                }
            ]
        except Exception as e:
            logger.error(f"Erro ao listar arquivos: {e}")
            return []
    
    async def get_contacts_from_file(self, file_id: int) -> List[Dict[str, Any]]:
        """Obter contatos de um arquivo específico"""
        try:
            # Simular contatos
            contacts = [
                {
                    "id": 1,
                    "name": "João Silva",
                    "phone": "5511999999999",
                    "email": "joao@exemplo.com",
                    "company": "Empresa A",
                    "position": "Gerente",
                    "status": "pending",
                    "created_at": datetime.now().isoformat()
                },
                {
                    "id": 2,
                    "name": "Maria Santos",
                    "phone": "5511888888888",
                    "email": "maria@exemplo.com",
                    "company": "Empresa B",
                    "position": "Diretora",
                    "status": "pending",
                    "created_at": datetime.now().isoformat()
                }
            ]
            
            return contacts
        except Exception as e:
            logger.error(f"Erro ao obter contatos: {e}")
            raise HTTPException(status_code=500, detail="Erro ao obter contatos")

