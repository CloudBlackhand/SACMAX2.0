"""
Serviço para processamento de arquivos Excel
"""

import os
import pandas as pd
import openpyxl
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import UploadFile, HTTPException
import logging
from datetime import datetime
import sys
import json

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
        
        # Verificar tamanho (10MB máximo)
        max_file_size = 10 * 1024 * 1024
        if hasattr(file, 'size') and file.size and file.size > max_file_size:
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
        """Ler arquivo Excel usando pandas"""
        try:
            logger.info(f"Processando arquivo: {file_path}")
            
            # Verificar extensão
            file_ext = Path(file_path).suffix.lower()
            
            if file_ext == '.csv':
                # Ler CSV
                df = pd.read_csv(file_path, encoding='utf-8')
                sheets_info = {
                    'main': {
                        'name': 'main',
                        'has_data': True,
                        'rows': len(df),
                        'columns': list(df.columns)
                    }
                }
                all_contacts = self._extract_contacts_from_dataframe(df, 'main')
                
            else:
                # Ler Excel
                excel_file = pd.ExcelFile(file_path)
                sheets_info = {}
                all_contacts = []
                
                # Processar cada planilha
                for sheet_name in excel_file.sheet_names:
                    try:
                        df = pd.read_excel(file_path, sheet_name=sheet_name)
                        
                        # Verificar se a planilha tem dados
                        has_data = len(df) > 0 and len(df.columns) > 0
                        
                        sheets_info[sheet_name] = {
                            'name': sheet_name,
                            'has_data': has_data,
                            'rows': len(df),
                            'columns': list(df.columns)
                        }
                        
                        if has_data:
                            # Extrair contatos da planilha
                            contacts = self._extract_contacts_from_dataframe(df, sheet_name)
                            all_contacts.extend(contacts)
                            
                    except Exception as e:
                        logger.warning(f"Erro ao processar planilha {sheet_name}: {e}")
                        sheets_info[sheet_name] = {
                            'name': sheet_name,
                            'has_data': False,
                            'error': str(e)
                        }
            
            return {
                'success': True,
                'file_path': file_path,
                'sheets': sheets_info,
                'contacts': all_contacts,
                'total_contacts': len(all_contacts),
                'processed_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro ao processar arquivo Excel: {e}")
            return {
                'success': False,
                'error': str(e),
                'file_path': file_path
            }
    
    def _extract_contacts_from_dataframe(self, df: pd.DataFrame, sheet_name: str) -> List[Dict[str, Any]]:
        """Extrair contatos de um DataFrame"""
        contacts = []
        
        try:
            # Limpar dados
            df = df.dropna(how='all')  # Remover linhas vazias
            df = df.fillna('')  # Preencher valores NaN
            
            # Mapear colunas comuns
            column_mapping = {
                'nome': ['nome', 'name', 'nome_cliente', 'cliente', 'nome do cliente'],
                'telefone': ['telefone', 'phone', 'telefone1', 'celular', 'whatsapp'],
                'email': ['email', 'e-mail', 'correio'],
                'empresa': ['empresa', 'company', 'companhia'],
                'cargo': ['cargo', 'position', 'função', 'funcao'],
                'endereco': ['endereco', 'address', 'endereço', 'rua', 'logradouro'],
                'cidade': ['cidade', 'city', 'municipio'],
                'estado': ['estado', 'state', 'uf'],
                'cpf': ['cpf', 'documento', 'cnpj'],
                'observacoes': ['observacoes', 'obs', 'observações', 'notas']
            }
            
            # Encontrar colunas correspondentes
            found_columns = {}
            for field, possible_names in column_mapping.items():
                for col in df.columns:
                    if any(name.lower() in str(col).lower() for name in possible_names):
                        found_columns[field] = col
                        break
            
            # Processar cada linha
            for index, row in df.iterrows():
                try:
                    contact = {
                        'id': index + 1,
                        'sheet_name': sheet_name,
                        'row_number': index + 2,  # +2 porque index começa em 0 e há cabeçalho
                        'processed_at': datetime.now().isoformat()
                    }
                    
                    # Extrair dados baseado no mapeamento
                    for field, col_name in found_columns.items():
                        value = row[col_name]
                        if pd.notna(value) and str(value).strip():
                            contact[field] = str(value).strip()
                    
                    # Se não encontrou mapeamento, usar todas as colunas
                    if len(found_columns) == 0:
                        for col in df.columns:
                            value = row[col]
                            if pd.notna(value) and str(value).strip():
                                contact[str(col).lower()] = str(value).strip()
                    
                    # Validar se tem pelo menos nome ou telefone
                    if contact.get('nome') or contact.get('telefone'):
                        contacts.append(contact)
                        
                except Exception as e:
                    logger.warning(f"Erro ao processar linha {index}: {e}")
                    continue
            
        except Exception as e:
            logger.error(f"Erro ao extrair contatos da planilha {sheet_name}: {e}")
        
        return contacts
    
    def process_excel_for_contacts(self, file_path: str) -> Dict[str, Any]:
        """Processar arquivo Excel especificamente para contatos"""
        try:
            result = self.read_excel_file(file_path)
        
            if not result.get('success'):
                return result
            
            # Filtrar contatos válidos
            valid_contacts = []
            for contact in result.get('contacts', []):
                # Validar se tem informações essenciais
                if contact.get('nome') or contact.get('telefone'):
                    # Limpar e formatar dados
                    cleaned_contact = self._clean_contact_data(contact)
                    if cleaned_contact:
                        valid_contacts.append(cleaned_contact)
            
            return {
                'success': True,
                'file_path': file_path,
                'total_contacts': len(valid_contacts),
                'valid_contacts': valid_contacts,
                'sheets_info': result.get('sheets', {}),
                'processed_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro ao processar Excel para contatos: {e}")
            return {
                'success': False,
                'error': str(e),
                'file_path': file_path
            }
    
    def _clean_contact_data(self, contact: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Limpar e validar dados do contato"""
        try:
            cleaned = {}
            
            # Nome
            if contact.get('nome'):
                cleaned['name'] = str(contact['nome']).strip()
            
            # Telefone
            if contact.get('telefone'):
                phone = str(contact['telefone']).strip()
                # Remover caracteres não numéricos
                phone = ''.join(filter(str.isdigit, phone))
                if len(phone) >= 10:  # Telefone válido
                    cleaned['phone'] = phone
            
            # Email
            if contact.get('email'):
                email = str(contact['email']).strip().lower()
                if '@' in email and '.' in email:
                    cleaned['email'] = email
            
            # Empresa
            if contact.get('empresa'):
                cleaned['company'] = str(contact['empresa']).strip()
            
            # Cargo
            if contact.get('cargo'):
                cleaned['position'] = str(contact['cargo']).strip()
            
            # Endereço
            if contact.get('endereco'):
                cleaned['address'] = str(contact['endereco']).strip()
            
            # CPF/Documento
            if contact.get('cpf'):
                cleaned['document'] = str(contact['cpf']).strip()
            
            # Observações
            if contact.get('observacoes'):
                cleaned['notes'] = str(contact['observacoes']).strip()
            
            # Dados originais
            cleaned['original_data'] = contact
            cleaned['created_at'] = datetime.now().isoformat()
            
            return cleaned if (cleaned.get('name') or cleaned.get('phone')) else None
            
        except Exception as e:
            logger.warning(f"Erro ao limpar dados do contato: {e}")
            return None
    
    def export_contacts_to_excel(self, contacts: List[Dict[str, Any]], filename: str = None) -> str:
        """Exportar contatos para arquivo Excel"""
        try:
            if not filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"contatos_exportados_{timestamp}.xlsx"
            
            file_path = self.upload_folder / filename
            
            # Criar DataFrame
            df = pd.DataFrame(contacts)
            
            # Salvar como Excel
            with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Contatos', index=False)
                
                # Ajustar largura das colunas
                worksheet = writer.sheets['Contatos']
                for column in worksheet.columns:
                    max_length = 0
                    column_letter = column[0].column_letter
                    for cell in column:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except:
                            pass
                    adjusted_width = min(max_length + 2, 50)
                    worksheet.column_dimensions[column_letter].width = adjusted_width
            
            return str(file_path)
            
        except Exception as e:
            logger.error(f"Erro ao exportar contatos: {e}")
            raise HTTPException(status_code=500, detail=f"Erro ao exportar: {str(e)}")
    
    def get_file_info(self, file_path: str) -> Dict[str, Any]:
        """Obter informações sobre o arquivo"""
        try:
            path = Path(file_path)
            if not path.exists():
                return {'error': 'Arquivo não encontrado'}
            
            # Informações básicas
            info = {
                'filename': path.name,
                'size': path.stat().st_size,
                'created_at': datetime.fromtimestamp(path.stat().st_ctime).isoformat(),
                'modified_at': datetime.fromtimestamp(path.stat().st_mtime).isoformat(),
                'extension': path.suffix.lower()
            }
            
            # Tentar obter informações do Excel
            if path.suffix.lower() in ['.xlsx', '.xls']:
                try:
                    excel_file = pd.ExcelFile(file_path)
                    info['sheets'] = excel_file.sheet_names
                    info['total_sheets'] = len(excel_file.sheet_names)
                except Exception as e:
                    info['excel_error'] = str(e)
            
            return info
            
        except Exception as e:
            logger.error(f"Erro ao obter informações do arquivo: {e}")
            return {'error': str(e)}
    
    def list_uploaded_files(self) -> List[Dict[str, Any]]:
        """Listar arquivos enviados"""
        try:
            files = []
            for file_path in self.upload_folder.glob('*'):
                if file_path.is_file():
                    info = self.get_file_info(str(file_path))
                    files.append(info)
            
            # Ordenar por data de modificação (mais recente primeiro)
            files.sort(key=lambda x: x.get('modified_at', ''), reverse=True)
            
            return files
            
        except Exception as e:
            logger.error(f"Erro ao listar arquivos: {e}")
            return []
    
    def delete_file(self, filename: str) -> bool:
        """Deletar arquivo"""
        try:
            file_path = self.upload_folder / filename
            if file_path.exists():
                file_path.unlink()
                return True
            return False
        except Exception as e:
            logger.error(f"Erro ao deletar arquivo: {e}")
            return False

