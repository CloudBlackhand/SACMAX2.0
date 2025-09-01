"""
Rotas para processamento de arquivos Excel
"""

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db
from app.services.excel_service import ExcelService

router = APIRouter()
excel_service = ExcelService()

@router.post("/upload")
async def upload_excel_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload e processamento de arquivo Excel
    """
    try:
        result = await excel_service.process_excel_file(file)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/files")
async def get_uploaded_files(db: Session = Depends(get_db)):
    """
    Listar arquivos enviados
    """
    try:
        files = await excel_service.get_uploaded_files()
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/files/{file_id}/contacts")
async def get_contacts_from_file(
    file_id: int,
    db: Session = Depends(get_db)
):
    """
    Obter contatos de um arquivo específico
    """
    try:
        contacts = await excel_service.get_contacts_from_file(file_id)
        return {"contacts": contacts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/files/{file_id}")
async def delete_uploaded_file(
    file_id: int,
    db: Session = Depends(get_db)
):
    """
    Deletar arquivo enviado
    """
    try:
        # Implementar lógica de deleção
        return {"message": "Arquivo deletado com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

