"""
Serviço para processamento de arquivos Excel
"""

import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import UploadFile, HTTPException
import logging
from datetime import datetime
import sys

# Adicionar o diretório backend ao path para importar excel_reader
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

try:
    from excel_reader import ExcelReader
except ImportError:
    ExcelReader = None
    logger.warning("ExcelReader não disponível - usando modo simulação")

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
    
    def read_excel_file(self, file_path: str) -> Dict[str, Any]:
        """Ler arquivo Excel usando ExcelReader"""
        try:
            if ExcelReader is None:
                # Modo simulação se ExcelReader não estiver disponível
                logger.warning("Usando dados simulados - ExcelReader não disponível")
                return self._get_simulated_data()
            
            # Usar ExcelReader real
            reader = ExcelReader()
            
            # Analisar estrutura do arquivo
            analysis = reader.analyze_excel_structure(file_path)
            
            # Extrair contatos prioritariamente da planilha PRODUTIVIDADE
            all_contacts = []
            sheets_info = []
            
            # Verificar se existe a planilha PRODUTIVIDADE
            if 'PRODUTIVIDADE' in analysis['sheets'] and analysis['sheets']['PRODUTIVIDADE']['has_data']:
                # Focar apenas na planilha PRODUTIVIDADE
                contacts = reader.extract_contacts(file_path, 'PRODUTIVIDADE')
                all_contacts.extend(contacts)
                
                sheets_info.append({
                    'name': 'PRODUTIVIDADE',
                    'rows': analysis['sheets']['PRODUTIVIDADE']['total_rows'],
                    'columns': analysis['sheets']['PRODUTIVIDADE']['total_columns'],
                    'contacts_found': len(contacts),
                    'is_primary': True
                })
            else:
                # Fallback: extrair de todas as planilhas se PRODUTIVIDADE não existir
                for sheet_name in analysis['sheets'].keys():
                    if analysis['sheets'][sheet_name]['has_data']:
                        contacts = reader.extract_contacts(file_path, sheet_name)
                        all_contacts.extend(contacts)
                        
                        sheets_info.append({
                            'name': sheet_name,
                            'rows': analysis['sheets'][sheet_name]['total_rows'],
                            'columns': analysis['sheets'][sheet_name]['total_columns'],
                            'contacts_found': len(contacts),
                            'is_primary': False
                        })
            
            return {
                'contacts': all_contacts,
                'analysis': analysis,
                'sheets': analysis['sheets'],  # Usar o dicionário de sheets da análise
                'sheets_info': sheets_info,     # Manter info adicional das sheets
                'total_contacts': len(all_contacts),
                'file_info': {
                    'size': analysis['file_size'],
                    'sheets_count': analysis['total_sheets']
                }
            }
            
        except Exception as e:
            logger.error(f"Erro ao ler arquivo Excel: {e}")
            # Fallback para dados simulados em caso de erro
            logger.warning("Usando dados simulados devido ao erro")
            return self._get_simulated_data()
    
    def _get_simulated_data(self) -> Dict[str, Any]:
        """Retorna dados simulados para fallback"""
        contacts = [
            {
                "id": 1,
                "name": "João Silva",
                "phone": "5511999999999",
                "email": "joao@exemplo.com",
                "company": "Empresa A",
                "sheet_name": "Simulação"
            },
            {
                "id": 2,
                "name": "Maria Santos",
                "phone": "5511888888888",
                "email": "maria@exemplo.com",
                "company": "Empresa B",
                "sheet_name": "Simulação"
            },
            {
                "id": 3,
                "name": "Pedro Costa",
                "phone": "5511777777777",
                "email": "pedro@exemplo.com",
                "company": "Empresa C",
                "sheet_name": "Simulação"
            }
        ]
        
        return {
            'contacts': contacts,
            'analysis': {'simulated': True},
            'sheets': [{'name': 'Simulação', 'contacts_found': len(contacts)}],
            'total_contacts': len(contacts),
            'file_info': {'simulated': True}
        }
    
    async def process_excel_file(self, file: UploadFile) -> Dict[str, Any]:
        """Processar arquivo Excel completo"""
        # Validar arquivo
        self.validate_file(file)
        
        # Salvar arquivo
        file_path = await self.save_uploaded_file(file)
        
        # Ler arquivo usando ExcelReader
        result = self.read_excel_file(file_path)
        
        # Preparar resposta
        response = {
            "message": "Arquivo processado com sucesso",
            "filename": file.filename,
            "contacts_count": result['total_contacts'],
            "contacts": result['contacts'],
            "sheets": result['sheets'],
            "file_info": result['file_info'],
            "file_id": 1
        }
        
        # Adicionar informações de análise se disponível
        if 'analysis' in result and not result['analysis'].get('simulated'):
            response['analysis'] = {
                'total_sheets': result['analysis']['total_sheets'],
                'file_size': result['analysis']['file_size'],
                'analysis_date': result['analysis']['analysis_date']
            }
            response['message'] = "Arquivo Excel processado com sucesso"
        else:
            response['message'] = "Arquivo processado com sucesso (modo simulação)"
        
        return response
    
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

