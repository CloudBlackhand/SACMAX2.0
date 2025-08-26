#!/usr/bin/env python3
"""
SacsMax Backend - API completa com FastAPI e integração de banco de dados PostgreSQL
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, BackgroundTasks, WebSocket, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
import uvicorn
import os
import json
import requests
from datetime import datetime
import threading
import time
from pathlib import Path
import logging
import pandas as pd
try:
    from database_pool import get_db_pool, init_database_pool, close_database_pool
    POOL_AVAILABLE = True
except ImportError:
    POOL_AVAILABLE = False
    print("⚠️ Pool de conexões não disponível, usando conexão direta")

from database_config import get_db_connection

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Importações condicionais para evitar erros
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from excel_to_database import ExcelToDatabaseConverter
    from database_config import db_manager, init_database, close_database
    from feedback_analyzer import feedback_analyzer
    from app.services.whatsapp_service import WhatsAppService
    from app.services.excel_service import ExcelService
    from app.services.sentiment_analyzer import sentiment_analyzer
    from app.services.feedback_service import feedback_service
except ImportError as e:
    print(f"⚠️ Erro de importação: {e}")
    ExcelToDatabaseConverter = None
    db_manager = None
    feedback_analyzer = None
    WhatsAppService = None
    ExcelService = None
    sentiment_analyzer = None
    feedback_service = None

# Modelos Pydantic
class WhatsAppStartRequest(BaseModel):
    port: int = 3001

# Configuração
PORT = int(os.environ.get('BACKEND_PORT', 5000))
FRONTEND_DIR = Path(__file__).parent.parent.parent / 'frontend'
WHATSAPP_API_URL = "http://localhost:3002"

# Criar aplicação FastAPI
app = FastAPI(
    title="SacsMax API",
    description="Sistema de Gestão de SAC com WhatsApp e Excel",
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar domínios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir arquivos estáticos do frontend
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

# Dados em memória (fallback se banco não estiver disponível)
contacts = []
messages = []
bot_config = {
    "name": "SacsMax Bot",
    "enabled": True,
    "welcome_message": "Olá! Como posso ajudar?",
    "working_hours": {"start": "08:00", "end": "18:00"}
}

# Instâncias dos serviços
whatsapp_service = WhatsAppService() if WhatsAppService else None
excel_service = ExcelService() if ExcelService else None

# Proxy para WhatsApp
@app.get("/api/whatsapp/status")
async def whatsapp_status():
    """Proxy para status do WhatsApp"""
    try:
        response = requests.get(f"{WHATSAPP_API_URL}/api/status", timeout=5)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except requests.RequestException as e:
        return JSONResponse(content={"error": "WhatsApp server não disponível"}, status_code=503)

@app.post("/api/whatsapp/send-message")
async def whatsapp_send_message(request: dict):
    """Proxy para envio de mensagens WhatsApp"""
    try:
        response = requests.post(f"{WHATSAPP_API_URL}/api/send-message", json=request, timeout=10)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except requests.RequestException as e:
        return JSONResponse(content={"error": "Erro ao enviar mensagem"}, status_code=503)

@app.get("/api/whatsapp/health")
async def whatsapp_health():
    """Proxy para health check do WhatsApp"""
    try:
        response = requests.get(f"{WHATSAPP_API_URL}/health", timeout=5)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except requests.RequestException as e:
        return JSONResponse(content={"error": "WhatsApp server não disponível"}, status_code=503)

@app.post("/api/sessions/add")
async def add_whatsapp_session(request: dict):
    """Proxy para adicionar sessão WhatsApp"""
    try:
        response = requests.post(f"{WHATSAPP_API_URL}/api/sessions/add", json=request, timeout=10)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except requests.RequestException as e:
        return JSONResponse(content={"error": "Erro ao criar sessão WhatsApp"}, status_code=503)

@app.delete("/api/sessions/remove")
async def remove_whatsapp_session(request: dict):
    """Proxy para remover sessão WhatsApp"""
    try:
        response = requests.delete(f"{WHATSAPP_API_URL}/api/sessions/remove", json=request, timeout=10)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except requests.RequestException as e:
        return JSONResponse(content={"error": "Erro ao remover sessão WhatsApp"}, status_code=503)

@app.get("/api/sessions/{session_name}/qr")
async def get_whatsapp_qr(session_name: str):
    """Proxy para gerar QR Code WhatsApp"""
    try:
        response = requests.get(f"{WHATSAPP_API_URL}/api/sessions/{session_name}/qr", timeout=10)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except requests.RequestException as e:
        return JSONResponse(content={"error": "Erro ao gerar QR Code WhatsApp"}, status_code=503)

@app.get("/api/sessions/{session_name}/status")
async def get_whatsapp_session_status(session_name: str):
    """Proxy para verificar status da sessão WhatsApp"""
    try:
        response = requests.get(f"{WHATSAPP_API_URL}/api/sessions/{session_name}/status", timeout=10)
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except requests.RequestException as e:
        return JSONResponse(content={"error": "Erro ao verificar status da sessão WhatsApp"}, status_code=503)

# Endpoints para persistência de sessão
@app.get("/api/whatsapp/sessions")
async def get_all_whatsapp_sessions():
    """Obter todas as sessões WhatsApp salvas"""
    try:
        if whatsapp_service:
            sessions = whatsapp_service.get_all_sessions()
            return JSONResponse(content={"sessions": sessions})
        return JSONResponse(content={"sessions": []})
    except Exception as e:
        logger.error(f"Erro ao obter sessões: {e}")
        return JSONResponse(content={"error": "Erro ao obter sessões"}, status_code=500)

@app.get("/api/whatsapp/sessions/{session_name}")
async def get_whatsapp_session(session_name: str):
    """Obter status de uma sessão específica"""
    try:
        if whatsapp_service:
            session = whatsapp_service.get_session_status(session_name)
            if session:
                return JSONResponse(content=session)
            return JSONResponse(content={"error": "Sessão não encontrada"}, status_code=404)
        return JSONResponse(content={"error": "Serviço WhatsApp não disponível"}, status_code=503)
    except Exception as e:
        logger.error(f"Erro ao obter sessão {session_name}: {e}")
        return JSONResponse(content={"error": "Erro ao obter sessão"}, status_code=500)

@app.post("/api/whatsapp/sessions/{session_name}/start")
async def start_whatsapp_session(session_name: str):
    """Iniciar sessão WhatsApp com persistência"""
    try:
        if whatsapp_service:
            success = await whatsapp_service.start_session(session_name)
            if success:
                return JSONResponse(content={"message": f"Sessão {session_name} iniciada com sucesso"})
            return JSONResponse(content={"error": "Erro ao iniciar sessão"}, status_code=500)
        return JSONResponse(content={"error": "Serviço WhatsApp não disponível"}, status_code=503)
    except Exception as e:
        logger.error(f"Erro ao iniciar sessão {session_name}: {e}")
        return JSONResponse(content={"error": "Erro ao iniciar sessão"}, status_code=500)

@app.post("/api/whatsapp/sessions/{session_name}/stop")
async def stop_whatsapp_session(session_name: str):
    """Parar sessão WhatsApp"""
    try:
        if whatsapp_service:
            success = await whatsapp_service.stop_session(session_name)
            if success:
                return JSONResponse(content={"message": f"Sessão {session_name} parada com sucesso"})
            return JSONResponse(content={"error": "Erro ao parar sessão"}, status_code=500)
        return JSONResponse(content={"error": "Serviço WhatsApp não disponível"}, status_code=503)
    except Exception as e:
        logger.error(f"Erro ao parar sessão {session_name}: {e}")
        return JSONResponse(content={"error": "Erro ao parar sessão"}, status_code=500)

@app.post("/api/whatsapp/sessions/{session_name}/restore")
async def restore_whatsapp_session(session_name: str):
    """Restaurar sessão WhatsApp automaticamente"""
    try:
        if whatsapp_service:
            await whatsapp_service.restore_sessions()
            return JSONResponse(content={"message": "Sessões restauradas com sucesso"})
        return JSONResponse(content={"error": "Serviço WhatsApp não disponível"}, status_code=503)
    except Exception as e:
        logger.error(f"Erro ao restaurar sessões: {e}")
        return JSONResponse(content={"error": "Erro ao restaurar sessões"}, status_code=500)

@app.post("/api/whatsapp/sessions/{session_name}")
async def update_whatsapp_session_status(session_name: str, request: dict):
    """Atualizar status de uma sessão WhatsApp"""
    try:
        if whatsapp_service:
            status = request.get('status', 'unknown')
            auto_restore = request.get('auto_restore', True)
            whatsapp_service.save_session_status(session_name, status, auto_restore)
            return JSONResponse(content={"message": f"Status da sessão {session_name} atualizado"})
        return JSONResponse(content={"error": "Serviço WhatsApp não disponível"}, status_code=503)
    except Exception as e:
        logger.error(f"Erro ao atualizar status da sessão {session_name}: {e}")
        return JSONResponse(content={"error": "Erro ao atualizar status da sessão"}, status_code=500)

@app.get("/api/whatsapp/messages/{session_name}")
async def get_whatsapp_messages(session_name: str, limit: int = 100):
    """Obter histórico de mensagens de uma sessão"""
    try:
        if whatsapp_service:
            # Implementar busca de mensagens no banco
            return JSONResponse(content={"messages": [], "session": session_name})
        return JSONResponse(content={"error": "Serviço WhatsApp não disponível"}, status_code=503)
    except Exception as e:
        logger.error(f"Erro ao obter mensagens: {e}")
        return JSONResponse(content={"error": "Erro ao obter mensagens"}, status_code=500)

@app.websocket("/ws/whatsapp")
async def websocket_whatsapp(websocket: WebSocket):
    """Proxy WebSocket para WhatsApp"""
    await websocket.accept()
    try:
        # Conectar ao WebSocket do servidor WhatsApp
        import websockets
        async with websockets.connect(f"ws://localhost:3002") as ws:
            # Bidirecional proxy
            async def forward_to_whatsapp():
                async for message in websocket.iter_text():
                    await ws.send(message)
            
            async def forward_to_client():
                async for message in ws:
                    await websocket.send_text(message)
            
            # Executar ambas as direções
            import asyncio
            await asyncio.gather(
                forward_to_whatsapp(),
                forward_to_client()
            )
    except Exception as e:
        logger.error(f"Erro no WebSocket proxy: {e}")
        await websocket.close()

@app.get("/", response_class=HTMLResponse)
async def index():
    """Serve o frontend"""
    frontend_file = FRONTEND_DIR / "index.html"
    if frontend_file.exists():
        return FileResponse(str(frontend_file), media_type="text/html")
    return """
    <html>
        <head><title>SacsMax</title></head>
        <body>
            <h1>SacsMax Backend</h1>
            <p>API está funcionando! Acesse <a href="/docs">/docs</a> para documentação.</p>
        </body>
    </html>
    """

@app.get("/modules/{file_path:path}")
async def serve_modules(file_path: str):
    """Serve arquivos do diretório modules"""
    module_file = FRONTEND_DIR / "modules" / file_path
    if module_file.exists() and module_file.is_file():
        return FileResponse(str(module_file))
    raise HTTPException(status_code=404, detail="Arquivo não encontrado")

@app.get("/main.js")
async def serve_main_js():
    """Serve o arquivo main.js"""
    main_file = FRONTEND_DIR / "main.js"
    if main_file.exists():
        return FileResponse(str(main_file), media_type="application/javascript")
    raise HTTPException(status_code=404, detail="Arquivo não encontrado")

@app.get("/health")
async def health_check():
    """Endpoint de verificação de saúde para Railway"""
    return {
        "status": "healthy",
        "service": "sacsmax-backend",
        "timestamp": datetime.now().isoformat(),
        "environment": os.environ.get("RAILWAY_ENVIRONMENT", "development")
    }

@app.get("/api/health")
async def health():
    """Health check da API"""
    try:
        # Verificar status do WhatsApp
        whatsapp_status = "not_available"
        try:
            response = requests.get(f"{WHATSAPP_API_URL}/api/status", timeout=5)
            if response.status_code == 200:
                whatsapp_data = response.json()
                whatsapp_status = "running" if whatsapp_data.get("success") else "error"
        except:
            whatsapp_status = "not_available"
    
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "2.1.0",
            "whatsapp": whatsapp_status,
            "database": "connected" if db_manager and db_manager.connection else "disconnected"
        }
    except Exception as e:
        logger.error(f"Erro no health check: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

# Endpoints do WhatsApp - Integração com WebSocket
@app.get("/api/whatsapp/status")
async def get_whatsapp_status():
    """Status do WhatsApp"""
    try:
        response = requests.get(f"{WHATSAPP_API_URL}/api/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            return {
                "connected": data.get("sessions", 0) > 0,
                "session_active": data.get("sessions", 0) > 0,
                "websocket_connections": data.get("websocketConnections", 0),
                "status": "running" if data.get("success") else "error"
            }
        else:
            return {
                "connected": False,
                "session_active": False,
                "websocket_connections": 0,
                "status": "error"
            }
    except Exception as e:
        logger.error(f"Erro ao verificar status WhatsApp: {e}")
        return {
            "connected": False,
            "session_active": False,
            "websocket_connections": 0,
            "status": "not_available"
        }

@app.post("/api/whatsapp/start")
async def start_whatsapp_session(session_name: str = "sacmax"):
    """Iniciar sessão do WhatsApp"""
    try:
        response = requests.post(f"{WHATSAPP_API_URL}/api/sessions/add", 
                               json={"sessionName": session_name}, 
                               timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": data.get("success", False),
                "message": data.get("message", "Sessão iniciada"),
                "session_name": session_name
            }
        else:
            return {
                "success": False,
                "message": "Erro ao iniciar sessão WhatsApp"
            }
    except Exception as e:
            logger.error(f"Erro ao iniciar sessão WhatsApp: {e}")
            return {
                "success": False,
                "message": f"Erro ao iniciar sessão: {str(e)}"
            }

@app.get("/api/whatsapp/qr")
async def get_whatsapp_qr(session_name: str = "sacmax"):
    """Obter QR Code do WhatsApp"""
    try:
        response = requests.get(f"{WHATSAPP_API_URL}/api/sessions/{session_name}/qr", timeout=5)
        if response.status_code == 200:
            data = response.json()
            return {
                "success": data.get("success", False),
                "qr_code": data.get("qr") if data.get("success") else None
            }
        else:
            return {
                "success": False,
                "qr_code": None
            }
    except Exception as e:
        logger.error(f"Erro ao obter QR Code: {e}")
        return {
            "success": False,
            "qr_code": None
        }

@app.post("/api/send-message")
async def send_whatsapp_message(message: dict):
    """Enviar mensagem WhatsApp"""
    try:
        session_name = message.get("sessionName", "sacmax")
        number = message.get("number")
        text = message.get("text")
        
        if not all([session_name, number, text]):
            raise HTTPException(status_code=400, detail="sessionName, number e text são obrigatórios")
        
        response = requests.post(f"{WHATSAPP_API_URL}/api/send-message", 
                               json={
                                   "sessionName": session_name,
                                   "number": number,
                                   "text": text
                               }, 
                               timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": data.get("success", False),
                "message_id": data.get("messageId"),
                "message": data.get("message", "Mensagem enviada")
            }
        else:
            return {
                "success": False,
                "message": "Erro ao enviar mensagem"
            }
    except Exception as e:
        logger.error(f"Erro ao enviar mensagem WhatsApp: {e}")
        return {
            "success": False,
            "message": f"Erro ao enviar mensagem: {str(e)}"
        }

@app.get("/api/chats")
async def get_whatsapp_chats(session_name: str = "sacmax"):
    """Obter chats do WhatsApp"""
    try:
        response = requests.get(f"{WHATSAPP_API_URL}/api/chats?sessionName={session_name}", timeout=10)
        if response.status_code == 200:
            data = response.json()
            return {
                "success": data.get("success", False),
                "chats": data.get("chats", [])
            }
        else:
            return {
                "success": False,
                "chats": []
        }
    except Exception as e:
        logger.error(f"Erro ao obter chats: {e}")
        return {
            "success": False,
            "chats": []
        }

@app.get("/api/messages/{contact_id}")
async def get_whatsapp_messages(contact_id: str, session_name: str = "sacmax", limit: int = 50):
    """Obter mensagens de um contato"""
    try:
        response = requests.get(f"{WHATSAPP_API_URL}/api/messages/{contact_id}?sessionName={session_name}&limit={limit}", timeout=10)
        if response.status_code == 200:
            data = response.json()
            return {
                "success": data.get("success", False),
                "messages": data.get("messages", [])
            }
        else:
            return {
                "success": False,
                "messages": []
            }
    except Exception as e:
        logger.error(f"Erro ao obter mensagens: {e}")
        return {
            "success": False,
            "messages": []
        }

# Endpoints existentes mantidos para compatibilidade
@app.get("/api/stats")
async def get_stats():
    """Estatísticas do sistema"""
    try:
        # Estatísticas básicas
        stats = {
            "total_contacts": len(contacts),
            "total_messages": len(messages),
            "bot_enabled": bot_config.get("enabled", False),
            "timestamp": datetime.now().isoformat()
        }
        
        # Adicionar estatísticas do banco se disponível
        if db_manager and db_manager.connection:
            try:
                # Contar contatos na tabela de produtividade
                result = db_manager.execute_query("SELECT COUNT(*) as count FROM produtividade")
                if result:
                    stats["database_contacts"] = result[0]['count']
                
                # Contar mensagens
                result = db_manager.execute_query("SELECT COUNT(*) as count FROM messages")
                if result:
                    stats["database_messages"] = result[0]['count']
                    
            except Exception as e:
                logger.error(f"Erro ao obter estatísticas do banco: {e}")
        
        return stats
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@app.get("/api/contacts/produtividade")
async def get_produtividade_contacts():
    """Obter contatos da tabela de produtividade"""
    try:
        if not db_manager or not db_manager.connection:
            return {
                "success": False,
                "contacts": [],
                "error": "Banco de dados não disponível"
            }
        
        # Buscar contatos da tabela de produtividade
        query = """
            SELECT 
                id,
                nome_cliente,
                telefone1,
                telefone2,
                documento,
                servico,
                sa,
                tecnico,
                status,
                data,
                endereco,
                plano,
                obs
            FROM produtividade 
            ORDER BY data DESC 
            LIMIT 100
        """
        
        result = db_manager.execute_query(query)
        
        if result:
            contacts = []
            for row in result:
                contact = {
                    "id": row['id'],
                    "nome_cliente": row['nome_cliente'],
                    "telefone1": row['telefone1'],
                    "telefone2": row['telefone2'],
                    "documento": row['documento'],
                    "servico": row['servico'],
                    "sa": row['sa'],
                    "tecnico": row['tecnico'],
                    "status": row['status'],
                    "data": row['data'].isoformat() if row['data'] else None,
                    "endereco": row['endereco'],
                    "plano": row['plano'],
                    "obs": row['obs']
                }
                contacts.append(contact)
            
            return {
                "success": True,
                "contacts": contacts,
                "total": len(contacts)
            }
        else:
            return {
                "success": True,
                "contacts": [],
                "total": 0
            }
            
    except Exception as e:
        logger.error(f"Erro ao obter contatos de produtividade: {e}")
        return {
            "success": False,
            "contacts": [],
            "error": str(e)
        }

@app.post("/api/messages/save")
async def save_message(message: dict):
    """Salvar mensagem no banco de dados"""
    try:
        if not db_manager or not db_manager.connection:
            return {
                "success": False,
                "message_id": None,
                "error": "Banco de dados não disponível"
            }
        
        contact_id = message.get("contact_id")
        text = message.get("text")
        is_outgoing = message.get("is_outgoing", False)
        message_type = message.get("type", "text")
        
        if not all([contact_id, text]):
            return {
                "success": False,
                "message_id": None,
                "error": "contact_id e text são obrigatórios"
            }
        
        # Inserir mensagem na tabela
        query = """
            INSERT INTO messages (contact_id, text, is_outgoing, type, timestamp)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """
        
        result = db_manager.execute_query(
            query, 
            (contact_id, text, is_outgoing, message_type, datetime.now())
        )
        
        if result:
            message_id = result[0]['id']
            return {
                "success": True,
                "message_id": message_id
            }
        else:
            return {
                "success": False,
                "message_id": None,
                "error": "Erro ao inserir mensagem"
            }
            
    except Exception as e:
        logger.error(f"Erro ao salvar mensagem: {e}")
        return {
            "success": False,
            "message_id": None,
            "error": str(e)
        }

@app.get("/api/messages/{contact_id}")
async def get_messages(contact_id: str, limit: int = 50):
    """Obter mensagens de um contato"""
    try:
        if not db_manager or not db_manager.connection:
            return {
                "success": False,
                "messages": [],
                "error": "Banco de dados não disponível"
            }
        
        # Buscar mensagens do contato
        query = """
            SELECT id, text, is_outgoing, type, timestamp
            FROM messages 
            WHERE contact_id = %s
            ORDER BY timestamp DESC 
            LIMIT %s
        """
        
        result = db_manager.execute_query(query, (contact_id, limit))
        
        if result:
            messages = []
            for row in result:
                message = {
                    "id": row['id'],
                    "text": row['text'],
                    "is_outgoing": row['is_outgoing'],
                    "type": row['type'],
                    "timestamp": row['timestamp'].isoformat() if row['timestamp'] else None
                }
                messages.append(message)
            
            # Ordenar por timestamp (mais antigas primeiro)
            messages.reverse()
            
            return {
                "success": True,
                "messages": messages
            }
        else:
            return {
                "success": True,
                "messages": []
            }
            
    except Exception as e:
        logger.error(f"Erro ao obter mensagens: {e}")
        return {
            "success": False,
            "messages": [],
            "error": str(e)
        }

# Endpoints do Excel
@app.post("/api/excel/upload")
async def upload_excel(file: UploadFile = File(...)):
    """Upload e processamento de arquivo Excel"""
    try:
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Apenas arquivos Excel são aceitos")
        
        # Salvar arquivo temporariamente
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        
        file_path = upload_dir / file.filename
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Processar arquivo usando ExcelService
        if excel_service:
            result = excel_service.read_excel_file(str(file_path))
            
            return {
                "success": True,
                "message": "Arquivo processado com sucesso",
                "data": result
            }
        else:
            return {
                "success": False,
                "message": "Serviço de Excel não disponível"
            }
            
    except Exception as e:
        logger.error(f"Erro no upload de Excel: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/excel/import")
async def import_excel_data(request: dict):
    """Importar dados do Excel para o banco de dados"""
    try:
        file_path = request.get("file_path")
        sheet_name = request.get("sheet_name", "PRODUTIVIDADE")
        
        if not file_path or not Path(file_path).exists():
            raise HTTPException(status_code=400, detail="Arquivo não encontrado")
        
        # Usar ExcelToDatabaseConverter para importar
        if ExcelToDatabaseConverter:
            converter = ExcelToDatabaseConverter(file_path)
            
            # Ler apenas a aba especificada
            excel_file = pd.ExcelFile(file_path)
            if sheet_name not in excel_file.sheet_names:
                raise HTTPException(status_code=400, detail=f"Aba {sheet_name} não encontrada")
            
            # Ler a aba PRODUTIVIDADE
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            
            # Usar pool de conexões
            db_pool = get_db_pool()
            with db_pool.get_connection() as conn:
                cursor = conn.cursor()
            
            # Limpar tabela existente (opcional - comentar se quiser manter dados)
            # cursor.execute("DELETE FROM produtividade")
            
            # Inserir dados na tabela produtividade
            imported_count = 0
            for index, row in df.iterrows():
                try:
                    # Mapear colunas da planilha para a tabela
                    cursor.execute("""
                        INSERT INTO produtividade (
                            data, tecnico, servico, sa, documento, nome_cliente, 
                            endereco, telefone1, telefone2, plano, status, obs, prazo_ca
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        row.get('DATA', None),
                        row.get('TECNICO', None),
                        row.get('SERVIÇO', None),
                        row.get('S.A', None),
                        row.get('DOCUMENTO', None),
                        row.get('NOME CLIENTE', None),
                        row.get('ENDEREÇO', None),
                        row.get('TELEFONE1', None),
                        row.get('TELEFONE2', None),
                        row.get('PLANO', None),
                        row.get('STATUS', None),
                        row.get('OBS', None),
                        row.get('PRAZO CA', None)
                    ))
                    imported_count += 1
                except Exception as e:
                    logger.warning(f"Erro ao inserir linha {index}: {e}")
                    continue
            
                conn.commit()
            
            return {
                "success": True,
                "message": f"Importação concluída com sucesso",
                "imported_records": imported_count,
                "total_records": len(df)
            }
        else:
            return {
                "success": False,
                "message": "Processador de Excel não disponível"
            }
            
    except Exception as e:
        logger.error(f"Erro na importação: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoints do Bot
@app.get("/api/bot/config")
async def get_bot_config():
    """Obter configuração do bot"""
    return bot_config

@app.put("/api/bot/config")
async def update_bot_config(config: dict):
    """Atualizar configuração do bot"""
    global bot_config
    bot_config.update(config)

# Endpoints de Produtividade
@app.get("/api/productivity/metrics")
async def get_productivity_metrics():
    """Obter métricas de produtividade do PostgreSQL"""
    try:
        # Usar pool de conexões
        db_pool = get_db_pool()
        with db_pool.get_connection() as conn:
            cursor = conn.cursor()
            
            # Métricas principais
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_contacts,
                    COUNT(CASE WHEN status = 'ativo' THEN 1 END) as active_contacts,
                    COUNT(CASE WHEN status = 'concluido' THEN 1 END) as completed_services,
                    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pending_services
                FROM produtividade
            """)
            
            metrics = cursor.fetchone()
            
            # Produtividade por técnico
            cursor.execute("""
                SELECT tecnico, COUNT(*) as services
                FROM produtividade 
                WHERE tecnico IS NOT NULL 
                GROUP BY tecnico 
                ORDER BY services DESC
            """)
            
            technicians = cursor.fetchall()
            productivity_by_technician = {
                tech[0]: {"services": tech[1], "percentage": 0} 
                for tech in technicians
            }
            
            # Tipos de serviço
            cursor.execute("""
                SELECT servico, COUNT(*) as count
                FROM produtividade 
                WHERE servico IS NOT NULL 
                GROUP BY servico 
                ORDER BY count DESC
            """)
            
            services = cursor.fetchall()
            services_by_type = {service[0]: service[1] for service in services}
        
        return {
            "totalContacts": metrics[0] or 0,
            "activeContacts": metrics[1] or 0,
            "completedServices": metrics[2] or 0,
            "pendingServices": metrics[3] or 0,
            "productivityByTechnician": productivity_by_technician,
            "servicesByType": services_by_type
        }
        
    except Exception as e:
        logger.error(f"Erro ao obter métricas de produtividade: {e}")
        return {
            "totalContacts": 0,
            "activeContacts": 0,
            "completedServices": 0,
            "pendingServices": 0,
            "productivityByTechnician": {},
            "servicesByType": {}
        }

@app.get("/api/productivity/contacts")
async def get_productivity_contacts(optimized: bool = False):
    """Obter lista de contatos da tabela PRODUTIVIDADE"""
    try:
        # Usar conexão direta otimizada
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Query otimizada
        query = """
            SELECT 
                data,
                tecnico,
                servico,
                sa,
                documento,
                nome_cliente,
                endereco,
                telefone1,
                telefone2,
                plano,
                status,
                obs
            FROM produtividade 
            ORDER BY data DESC
        """
        
        if not optimized:
            query += " LIMIT 1000"  # Limitar para performance
        
        cursor.execute(query)
        contacts = cursor.fetchall()
        
        # Converte para lista de dicionários
        contacts_list = []
        for contact in contacts:
            contacts_list.append({
                "data": contact[0].isoformat() if contact[0] else None,
                "tecnico": contact[1],
                "servico": contact[2],
                "sa": contact[3],
                "documento": contact[4],
                "nome_cliente": contact[5],
                "endereco": contact[6],
                "telefone1": contact[7],
                "telefone2": contact[8],
                "plano": contact[9],
                "status": contact[10],
                "obs": contact[11]
            })
        
        cursor.close()
        conn.close()
        
        return {
            "success": True,
            "contacts": contacts_list,
            "total": len(contacts_list),
            "optimized": optimized,
            "connection_status": "direct"
        }
        
    except Exception as e:
        logger.error(f"Erro ao obter contatos de produtividade: {e}")
        return {
            "success": False,
            "contacts": [],
            "total": 0,
            "error": str(e),
            "optimized": optimized,
            "connection_status": "error"
        }

@app.put("/api/bot/config")
async def update_bot_config(config: dict):
    """Atualizar configuração do bot"""
    global bot_config
    bot_config.update(config)
    return {"success": True, "message": "Configuração atualizada"}

# Endpoints de Feedback
@app.post("/api/feedback/analyze")
async def analyze_feedback(feedback: dict):
    """Analisar feedback"""
    try:
        if sentiment_analyzer:
            text = feedback.get("text", "")
            sentiment, score, keywords = sentiment_analyzer.analyze_sentiment(text)
            
            return {
                "success": True,
                "sentiment": sentiment,
                "score": score,
                "keywords": keywords,
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "success": False,
                "message": "Analisador de feedback não disponível"
            }
    except Exception as e:
        logger.error(f"Erro ao analisar feedback: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/feedback/save")
async def save_feedback(feedback: dict):
    """Salvar feedback no banco de dados"""
    try:
        if feedback_service:
            # Configurar o db_manager se disponível
            if db_manager:
                feedback_service.db_manager = db_manager
            
            result = feedback_service.analyze_and_save_message(feedback)
            
            if result:
                return {
                    "success": True,
                    "feedback": result,
                    "message": "Feedback analisado e salvo com sucesso"
                }
            else:
                return {
                    "success": False,
                    "message": "Erro ao processar feedback"
                }
        else:
            return {
                "success": False,
                "message": "Serviço de feedback não disponível"
            }
    except Exception as e:
        logger.error(f"Erro ao salvar feedback: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/feedback/list")
async def get_feedbacks(limit: int = 100, sentiment: str = None):
    """Listar feedbacks do banco de dados"""
    try:
        if feedback_service:
            # Configurar o db_manager se disponível
            if db_manager:
                feedback_service.db_manager = db_manager
            
            if sentiment and sentiment in ['positive', 'negative', 'neutral']:
                feedbacks = feedback_service.get_feedbacks_by_sentiment(sentiment, limit)
            else:
                feedbacks = feedback_service.get_all_feedbacks(limit)
            
            return {
                "success": True,
                "feedbacks": feedbacks,
                "total": len(feedbacks)
            }
        else:
            return {
                "success": False,
                "message": "Serviço de feedback não disponível"
            }
    except Exception as e:
        logger.error(f"Erro ao listar feedbacks: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/feedback/stats")
async def get_feedback_stats():
    """Obter estatísticas dos feedbacks"""
    try:
        if feedback_service:
            # Configurar o db_manager se disponível
            if db_manager:
                feedback_service.db_manager = db_manager
            
            stats = feedback_service.get_feedback_stats()
            
            return {
                "success": True,
                "stats": stats
            }
        else:
            return {
                "success": False,
                "message": "Serviço de feedback não disponível"
            }
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {e}")
        return {
            "success": False,
            "error": str(e)
        }

# Endpoints de Controle do WhatsApp Server
@app.post("/api/whatsapp-server/start")
async def start_whatsapp_server(request: WhatsAppStartRequest):
    """Iniciar servidor WhatsApp"""
    try:
        import subprocess
        import os
        from pathlib import Path
        
        # Verificar se estamos no Railway
        is_railway = os.environ.get('RAILWAY_ENVIRONMENT') is not None or os.environ.get('PORT') is not None
        
        if is_railway:
            return {
                "success": False,
                "message": "WhatsApp server não pode ser iniciado no Railway. Use o sistema localmente para funcionalidade completa do WhatsApp.",
                "status": "railway_unsupported",
                "railway": True
            }
        
        # Obter porta do request
        port = request.port
        
        # Verificar se já está rodando na porta especificada
        try:
            response = requests.get(f"http://localhost:{port}/api/status", timeout=2)
            if response.ok:
                return {
                    "success": True,
                    "message": f"Servidor WhatsApp já está rodando na porta {port}",
                    "status": "running",
                    "port": port
                }
        except:
            pass
        
        # Caminho para o servidor WhatsApp
        whatsapp_server = Path(__file__).parent.parent.parent / 'whatsapp-server-simple.js'
        
        if not whatsapp_server.exists():
            return {
                "success": False,
                "message": "Arquivo whatsapp-server-simple.js não encontrado",
                "status": "error"
            }
        
        # Iniciar processo e deixar o servidor escolher a porta
        # Não capturar stdout/stderr para evitar travamento
        process = subprocess.Popen(
            ['node', str(whatsapp_server)],
            stdout=None,  # Usar stdout do sistema
            stderr=None,  # Usar stderr do sistema
            text=True
        )
        
        # Aguardar um pouco para verificar se iniciou
        import time
        time.sleep(5)
        
        if process.poll() is None:
            # Detectar em qual porta o servidor iniciou
            detected_port = None
            for test_port in range(3001, 3010):
                try:
                    response = requests.get(f"http://localhost:{test_port}/api/status", timeout=2)
                    if response.ok:
                        detected_port = test_port
                        break
                except:
                    continue
            
            if detected_port:
                return {
                    "success": True,
                    "message": f"Servidor WhatsApp iniciado com sucesso na porta {detected_port}",
                    "status": "running",
                    "port": detected_port,
                    "pid": process.pid
                }
            else:
                return {
                    "success": True,
                    "message": "Servidor WhatsApp iniciado (porta não detectada)",
                    "status": "running",
                    "pid": process.pid
                }
        else:
            return {
                "success": False,
                "message": "Erro ao iniciar servidor: processo terminou prematuramente",
                "status": "error"
            }
            
    except Exception as e:
        logger.error(f"Erro ao iniciar WhatsApp server: {e}")
        return {
            "success": False,
            "message": f"Erro interno: {str(e)}",
            "status": "error"
        }

@app.post("/api/whatsapp-server/stop")
async def stop_whatsapp_server():
    """Parar servidor WhatsApp"""
    try:
        # Tentar parar via API
        try:
            response = requests.post(f"{WHATSAPP_API_URL}/api/shutdown", timeout=5)
            if response.ok:
                return {
                    "success": True,
                    "message": "Servidor WhatsApp parado com sucesso",
                    "status": "stopped"
                }
        except:
            pass
        
        # Se não conseguir parar via API, tentar matar o processo
        import psutil
        
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                if proc.info['name'] == 'node' and any('whatsapp-server' in cmd for cmd in proc.info['cmdline']):
                    proc.terminate()
                    proc.wait(timeout=5)
                    return {
                        "success": True,
                        "message": "Servidor WhatsApp parado com sucesso",
                        "status": "stopped"
                    }
            except (psutil.NoSuchProcess, psutil.TimeoutExpired):
                continue
        
        return {
            "success": False,
            "message": "Servidor WhatsApp não encontrado",
            "status": "not_found"
        }
        
    except Exception as e:
        logger.error(f"Erro ao parar WhatsApp server: {e}")
        return {
            "success": False,
            "message": f"Erro interno: {str(e)}",
            "status": "error"
        }

@app.get("/api/whatsapp-server/status")
async def get_whatsapp_server_status():
    """Verificar status do servidor WhatsApp"""
    try:
        response = requests.get(f"{WHATSAPP_API_URL}/api/status", timeout=3)
        if response.ok:
            data = response.json()
            return {
                "success": True,
                "status": "running",
                "data": data
            }
        else:
            return {
                "success": False,
                "status": "stopped",
                "message": "Servidor não responde"
            }
    except Exception as e:
        return {
            "success": False,
            "status": "stopped",
            "message": "Servidor não acessível"
        }

# Endpoints da Produtividade
@app.get("/api/productivity/contacts")
async def get_productivity_contacts():
    """Buscar todos os contatos da tabela produtividade"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                sa, data, tecnico, servico, nome_cliente, 
                endereco, telefone1, telefone2, plano, status, obs,
                created_at, updated_at
            FROM produtividade 
            ORDER BY data DESC, created_at DESC
        """)
        
        rows = cursor.fetchall()
        contacts = []
        
        for row in rows:
            contacts.append({
                "sa": row[0],
                "data": row[1].isoformat() if row[1] else None,
                "tecnico": row[2],
                "servico": row[3],
                "nome_cliente": row[4],
                "endereco": row[5],
                "telefone1": row[6],
                "telefone2": row[7],
                "plano": row[8],
                "status": row[9],
                "obs": row[10],
                "created_at": row[11].isoformat() if row[11] else None,
                "updated_at": row[12].isoformat() if row[12] else None
            })
        
        cursor.close()
        conn.close()
        
        return {
            "success": True,
            "contacts": contacts,
            "total": len(contacts)
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar contatos: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar contatos: {str(e)}")

@app.get("/api/productivity/stats")
async def get_productivity_stats():
    """Buscar estatísticas da produtividade"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Total de registros
        cursor.execute("SELECT COUNT(*) FROM produtividade")
        total_records = cursor.fetchone()[0]
        
        # Registros por status
        cursor.execute("""
            SELECT status, COUNT(*) 
            FROM produtividade 
            GROUP BY status 
            ORDER BY COUNT(*) DESC
        """)
        status_stats = dict(cursor.fetchall())
        
        # Registros por técnico
        cursor.execute("""
            SELECT tecnico, COUNT(*) 
            FROM produtividade 
            GROUP BY tecnico 
            ORDER BY COUNT(*) DESC 
            LIMIT 10
        """)
        technician_stats = dict(cursor.fetchall())
        
        # Registros por serviço
        cursor.execute("""
            SELECT servico, COUNT(*) 
            FROM produtividade 
            GROUP BY servico 
            ORDER BY COUNT(*) DESC 
            LIMIT 10
        """)
        service_stats = dict(cursor.fetchall())
        
        cursor.close()
        conn.close()
        
        return {
            "success": True,
            "stats": {
                "total_records": total_records,
                "status_stats": status_stats,
                "technician_stats": technician_stats,
                "service_stats": service_stats
            }
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar estatísticas: {str(e)}")

@app.get("/api/productivity/search")
async def search_productivity_contacts(
    q: str = Query(None, description="Termo de busca"),
    status: str = Query(None, description="Filtrar por status"),
    tecnico: str = Query(None, description="Filtrar por técnico"),
    servico: str = Query(None, description="Filtrar por serviço"),
    limit: int = Query(100, description="Limite de resultados")
):
    """Buscar contatos com filtros"""
    try:
        # Usar pool de conexões
        db_pool = get_db_pool()
        with db_pool.get_connection() as conn:
            cursor = conn.cursor()
            
            # Construir query dinamicamente
            query = """
                SELECT 
                    sa, data, tecnico, servico, nome_cliente, 
                    endereco, telefone1, telefone2, plano, status, obs,
                    created_at, updated_at
                FROM produtividade 
                WHERE 1=1
            """
            params = []
            
            if q:
                query += """ AND (
                    nome_cliente ILIKE %s OR 
                    tecnico ILIKE %s OR 
                    sa ILIKE %s OR 
                    servico ILIKE %s OR
                    telefone1 ILIKE %s OR
                    telefone2 ILIKE %s
                )"""
                search_term = f"%{q}%"
                params.extend([search_term] * 6)
            
            if status:
                query += " AND status ILIKE %s"
                params.append(f"%{status}%")
            
            if tecnico:
                query += " AND tecnico ILIKE %s"
                params.append(f"%{tecnico}%")
            
            if servico:
                query += " AND servico ILIKE %s"
                params.append(f"%{servico}%")
            
            query += " ORDER BY data DESC, created_at DESC LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            contacts = []
            for row in rows:
                contacts.append({
                    "sa": row[0],
                    "data": row[1].isoformat() if row[1] else None,
                    "tecnico": row[2],
                    "servico": row[3],
                    "nome_cliente": row[4],
                    "endereco": row[5],
                    "telefone1": row[6],
                    "telefone2": row[7],
                    "plano": row[8],
                    "status": row[9],
                    "obs": row[10],
                    "created_at": row[11].isoformat() if row[11] else None,
                    "updated_at": row[12].isoformat() if row[12] else None
                })
        
        return {
            "success": True,
            "contacts": contacts,
            "total": len(contacts),
            "filters": {
                "search": q,
                "status": status,
                "tecnico": tecnico,
                "servico": servico
            }
        }
        
    except Exception as e:
        logger.error(f"Erro na busca: {e}")
        raise HTTPException(status_code=500, detail=f"Erro na busca: {str(e)}")

# Eventos de inicialização e finalização
@app.on_event("startup")
async def startup_event():
    """Evento de inicialização"""
    logger.info("🚀 Iniciando SacsMax Backend...")
    
    # Inicializar banco de dados
    if db_manager:
        init_database()
    
    # Inicializar serviços
    if whatsapp_service:
        await whatsapp_service.initialize()
    
    logger.info("✅ SacsMax Backend iniciado com sucesso!")

@app.on_event("shutdown")
async def shutdown_event():
    """Evento de finalização"""
    logger.info("🛑 Encerrando SacsMax Backend...")
    
    # Fechar conexões
    if db_manager:
        close_database()
    
    # Limpar serviços
    if whatsapp_service:
        await whatsapp_service.cleanup()
    
    logger.info("✅ SacsMax Backend encerrado!")

# Executar servidor
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
