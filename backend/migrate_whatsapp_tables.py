#!/usr/bin/env python3
"""
Script de migração para criar tabelas WhatsApp no PostgreSQL do Railway
Executa automaticamente durante o startup do sistema
"""

import os
import sys
import logging
from database_config import get_db_manager

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_whatsapp_tables():
    """Executar migração das tabelas WhatsApp"""
    try:
        logger.info("🗄️ Iniciando migração das tabelas WhatsApp...")
        
        # Conectar ao banco
        db_manager = get_db_manager()
        if not db_manager:
            logger.error("❌ Não foi possível conectar ao banco de dados")
            return False
        
        # Script de criação das tabelas
        migration_script = """
        -- Tabela de chats WhatsApp
        CREATE TABLE IF NOT EXISTS whatsapp_chats (
            id SERIAL PRIMARY KEY,
            phone VARCHAR(20) UNIQUE NOT NULL,
            name VARCHAR(100),
            avatar_url TEXT,
            status VARCHAR(20) DEFAULT 'online',
            last_message TEXT,
            last_message_time TIMESTAMP,
            unread_count INTEGER DEFAULT 0,
            is_pinned BOOLEAN DEFAULT FALSE,
            is_muted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabela de mensagens WhatsApp
        CREATE TABLE IF NOT EXISTS whatsapp_messages (
            id SERIAL PRIMARY KEY,
            message_id VARCHAR(100) UNIQUE,
            chat_phone VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            sender VARCHAR(100),
            message_type VARCHAR(20) DEFAULT 'text',
            direction VARCHAR(10) NOT NULL,
            status VARCHAR(20) DEFAULT 'received',
            timestamp TIMESTAMP,
            waha_data JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Índices para performance
        CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_phone ON whatsapp_chats(phone);
        CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_last_message_time ON whatsapp_chats(last_message_time DESC);
        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat_phone ON whatsapp_messages(chat_phone);
        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages(direction);
        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);

        -- Triggers para updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_whatsapp_chats_updated_at ON whatsapp_chats;
        CREATE TRIGGER update_whatsapp_chats_updated_at 
        BEFORE UPDATE ON whatsapp_chats 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_whatsapp_messages_updated_at ON whatsapp_messages;
        CREATE TRIGGER update_whatsapp_messages_updated_at 
        BEFORE UPDATE ON whatsapp_messages 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """
        
        # Executar comandos separadamente
        commands = [cmd.strip() for cmd in migration_script.split(';') if cmd.strip() and not cmd.strip().startswith('--')]
        
        for cmd in commands:
            if cmd:
                try:
                    db_manager.execute_query(cmd)
                    logger.info(f"✅ Comando executado: {cmd[:50]}...")
                except Exception as e:
                    logger.warning(f"⚠️ Comando falhou (pode ser normal): {cmd[:50]}... - {e}")
        
        # Verificar se as tabelas foram criadas
        verify_query = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('whatsapp_chats', 'whatsapp_messages')
        """
        
        results = db_manager.fetch_all(verify_query)
        tables_created = [row[0] for row in results]
        
        if 'whatsapp_chats' in tables_created and 'whatsapp_messages' in tables_created:
            logger.info("✅ Migração concluída com sucesso!")
            logger.info(f"📊 Tabelas criadas: {', '.join(tables_created)}")
            return True
        else:
            logger.error(f"❌ Nem todas as tabelas foram criadas: {tables_created}")
            return False
        
    except Exception as e:
        logger.error(f"❌ Erro na migração: {e}")
        return False

def check_tables_exist():
    """Verificar se as tabelas WhatsApp já existem"""
    try:
        db_manager = get_db_manager()
        if not db_manager:
            return False
        
        verify_query = """
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('whatsapp_chats', 'whatsapp_messages')
        """
        
        result = db_manager.fetch_all(verify_query)
        count = result[0][0] if result else 0
        
        return count == 2  # Ambas as tabelas devem existir
        
    except Exception as e:
        logger.error(f"❌ Erro ao verificar tabelas: {e}")
        return False

def main():
    """Função principal"""
    logger.info("🚀 Script de migração WhatsApp iniciado")
    
    # Verificar se as tabelas já existem
    if check_tables_exist():
        logger.info("✅ Tabelas WhatsApp já existem, pulando migração")
        return True
    
    # Executar migração
    success = migrate_whatsapp_tables()
    
    if success:
        logger.info("🎉 Migração WhatsApp concluída com sucesso!")
    else:
        logger.error("❌ Falha na migração WhatsApp")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

