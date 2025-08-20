#!/usr/bin/env node

/**
 * Script de configuração do PostgreSQL do Railway
 * Prepara o banco de dados para uso com SacsMax
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

class RailwaySetup {
    constructor() {
        this.client = null;
    }

    async connect() {
        try {
            this.client = new Client({
                connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL
            });
            await this.client.connect();
            console.log('✅ Conectado ao PostgreSQL do Railway');
            return true;
        } catch (error) {
            console.error('❌ Erro ao conectar ao PostgreSQL:', error.message);
            return false;
        }
    }

    async createTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS feedback_responses (
                id SERIAL PRIMARY KEY,
                feedback_id VARCHAR(255),
                response TEXT,
                rating INTEGER,
                contact VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            
            `CREATE TABLE IF NOT EXISTS excel_data (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                data JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            
            `CREATE TABLE IF NOT EXISTS campaigns (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                message TEXT,
                targets JSONB,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT NOW(),
                executed_at TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS whatsapp_sessions (
                id SERIAL PRIMARY KEY,
                session_name VARCHAR(255) UNIQUE,
                status VARCHAR(50) DEFAULT 'disconnected',
                last_activity TIMESTAMP,
                qr_code TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )`
        ];

        try {
            for (const tableSQL of tables) {
                await this.client.query(tableSQL);
                console.log('✅ Tabela criada/atualizada');
            }
            return true;
        } catch (error) {
            console.error('❌ Erro ao criar tabelas:', error);
            return false;
        }
    }

    async testConnection() {
        try {
            const result = await this.client.query('SELECT version()');
            console.log('📊 Versão do PostgreSQL:', result.rows[0].version);
            
            const tables = await this.client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `);
            
            console.log('📋 Tabelas existentes:', tables.rows.map(t => t.table_name));
            return true;
        } catch (error) {
            console.error('❌ Erro ao testar conexão:', error);
            return false;
        }
    }

    async setup() {
        console.log('🚀 Iniciando configuração do Railway PostgreSQL...\n');
        
        if (!process.env.DATABASE_URL && !process.env.DATABASE_PUBLIC_URL) {
            console.error('❌ DATABASE_URL ou DATABASE_PUBLIC_URL não configurado');
            console.log('💡 Configure a variável DATABASE_URL no Railway ou no arquivo .env');
            return false;
        }

        const connected = await this.connect();
        if (!connected) return false;

        console.log('📦 Criando tabelas...');
        await this.createTables();

        console.log('🔍 Testando conexão...');
        await this.testConnection();

        await this.client.end();
        console.log('\n✅ Configuração concluída!');
        return true;
    }
}

// Executar configuração
if (require.main === module) {
    const setup = new RailwaySetup();
    setup.setup().catch(console.error);
}

module.exports = RailwaySetup;