from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
import os

# Adiciona o diretório do projeto ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from services.google_sheets_service import GoogleSheetsService, process_spreadsheet_data

router = APIRouter(prefix="/api/sheets", tags=["sheets"])

class SpreadsheetRequest(BaseModel):
    url: str
    range_name: Optional[str] = "A:Z"

class SpreadsheetResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class AuthRequest(BaseModel):
    use_user_auth: bool = False

@router.post("/auth")
async def authenticate_sheets(request: AuthRequest):
    """Autentica com Google Sheets (usuário ou aplicação)"""
    try:
        sheets_service = GoogleSheetsService()
        
        if request.use_user_auth:
            success = sheets_service.authenticate_user()
            auth_type = "usuário"
        else:
            success = sheets_service.authenticate()
            auth_type = "aplicação"
        
        if success:
            return {
                "success": True,
                "message": f"Autenticação com {auth_type} realizada com sucesso",
                "auth_type": auth_type
            }
        else:
            return {
                "success": False,
                "message": f"Falha na autenticação com {auth_type}",
                "error": "Erro de autenticação"
            }
            
    except Exception as e:
        return {
            "success": False,
            "message": "Erro durante autenticação",
            "error": str(e)
        }

@router.post("/read", response_model=SpreadsheetResponse)
async def read_spreadsheet(request: SpreadsheetRequest):
    """Lê dados de uma planilha do Google Sheets"""
    try:
        sheets_service = GoogleSheetsService()
        
        # Extrai o ID da planilha da URL
        spreadsheet_id = sheets_service.extract_spreadsheet_id(request.url)
        
        if not spreadsheet_id:
            raise HTTPException(status_code=400, detail="URL da planilha inválida")
        
        # Obtém informações da planilha
        spreadsheet_info = sheets_service.get_spreadsheet_info(spreadsheet_id)
        
        if not spreadsheet_info:
            raise HTTPException(status_code=404, detail="Planilha não encontrada ou sem permissão")
        
        # Lê os dados da planilha
        raw_data = sheets_service.read_spreadsheet(spreadsheet_id, request.range_name)
        
        if not raw_data:
            raise HTTPException(status_code=404, detail="Nenhum dado encontrado na planilha")
        
        # Processa os dados
        processed_data = process_spreadsheet_data(raw_data)
        
        return SpreadsheetResponse(
            success=True,
            message=f"Planilha '{spreadsheet_info.get('title', 'Sem título')}' lida com sucesso",
            data={
                'spreadsheet_info': spreadsheet_info,
                'processed_data': processed_data
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        return SpreadsheetResponse(
            success=False,
            message="Erro ao ler planilha",
            error=str(e)
        )

@router.get("/info/{spreadsheet_id}")
async def get_spreadsheet_info(spreadsheet_id: str):
    """Obtém informações sobre uma planilha"""
    try:
        sheets_service = GoogleSheetsService()
        info = sheets_service.get_spreadsheet_info(spreadsheet_id)
        
        if not info:
            raise HTTPException(status_code=404, detail="Planilha não encontrada")
        
        return {
            "success": True,
            "data": info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter informações: {str(e)}")

@router.post("/extract-id")
async def extract_spreadsheet_id(request: SpreadsheetRequest):
    """Extrai o ID da planilha de uma URL"""
    try:
        sheets_service = GoogleSheetsService()
        spreadsheet_id = sheets_service.extract_spreadsheet_id(request.url)
        
        return {
            "success": True,
            "spreadsheet_id": spreadsheet_id,
            "original_url": request.url
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao extrair ID: {str(e)}")
