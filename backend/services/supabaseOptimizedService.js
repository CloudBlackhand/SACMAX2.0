const { supabase, supabaseAdmin } = require('../config/supabase');
const logger = require('../utils/logger');
const cacheService = require('./cacheService');

class SupabaseOptimizedService {
  constructor() {
    this.TABLES = {
      UPLOAD_SESSIONS: 'upload_sessions',
      CLIENTS: 'clients_optimized',
      SENT_CONTACTS: 'sent_contacts',
      CLIENT_METRICS: 'client_metrics',
      FEEDBACK_ENTRIES: 'feedback_entries'
    };
  }

  /**
   * Cria uma sessão de upload otimizada
   */
  async createUploadSession(fileName, fileSize, mode) {
    try {
      const session = {
        file_name: fileName,
        file_size: fileSize,
        mode: mode,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(this.TABLES.UPLOAD_SESSIONS)
        .insert(session)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Erro ao criar sessão de upload:', error);
      throw error;
    }
  }

  /**
   * Normaliza telefone para formato padrão
   */
  normalizePhone(phone) {
    if (!phone) return null;
    return phone.toString().replace(/\D/g, '').replace(/^0/, '55');
  }

  /**
   * Gera chave única para cliente baseada em nome e telefone
   */
  generateClientKey(name, phone) {
    const normalizedName = name ? name.toLowerCase().trim() : '';
    const normalizedPhone = this.normalizePhone(phone);
    return `${normalizedName}_${normalizedPhone}`.substring(0, 255);
  }

  /**
   * Salva/atualiza cliente de forma otimizada
   */
  async upsertClientOptimized(clientData) {
    try {
      const clientKey = this.generateClientKey(
        clientData.client_name || clientData.name, 
        clientData.phone
      );

      const clientRecord = {
        client_key: clientKey,
        display_name: clientData.client_name || clientData.name,
        phone_normalized: this.normalizePhone(clientData.phone),
        email: clientData.email || null,
        source: clientData.source || 'spreadsheet',
        last_updated: new Date().toISOString()
      };

      // Adicionar metadata se houver
      if (clientData.additional_data) {
        clientRecord.metadata = {
          sheet_name: clientData.sheet_name,
          row_number: clientData.row_number,
          additional_info: clientData.additional_data
        };
      }

      const { data, error } = await supabase
        .from(this.TABLES.CLIENTS)
        .upsert(clientRecord, { onConflict: 'client_key' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Erro ao salvar cliente otimizado:', error);
      throw error;
    }
  }

  /**
   * Processa e salva dados da planilha de forma otimizada
   */
  async processSpreadsheetDataOptimized(spreadsheetData, fileName, mode) {
    const startTime = Date.now();
    let session = null;

    try {
      // Criar sessão de upload
      session = await this.createUploadSession(
        fileName, 
        JSON.stringify(spreadsheetData).length,
        mode
      );

      await this.updateUploadStatus(session.id, 'processing');

      let savedRecords = 0;
      let clientRecords = [];

      if (mode === 'client_data') {
        // Processar dados de clientes por data
        const { client_data_by_date } = spreadsheetData;
        
        for (const [date, clients] of Object.entries(client_data_by_date)) {
          for (const [clientId, clientInfo] of Object.entries(clients)) {
            // Salvar cliente
            const client = await this.upsertClientOptimized({
              client_name: clientInfo.client_name,
              phone: this.extractPhoneFromData(clientInfo.data),
              sheet_name: clientInfo.sheet,
              row_number: clientInfo.row,
              additional_data: clientInfo.data
            });

            // Salvar métricas do cliente
            await this.saveClientMetrics(client.id, date, {
              sheet_name: clientInfo.sheet,
              row_number: clientInfo.row,
              data: clientInfo.data,
              upload_session_id: session.id
            });

            clientRecords.push({
              client_id: client.id,
              phone: this.extractPhoneFromData(clientInfo.data),
              name: clientInfo.client_name,
              upload_session_id: session.id
            });

            savedRecords++;
          }
        }
      } else {
        // Processar contatos
        const { contacts } = spreadsheetData;
        
        for (const contact of contacts) {
          const client = await this.upsertClientOptimized({
            client_name: contact.name,
            phone: contact.phone,
            sheet_name: contact.sheet,
            row_number: contact.row,
            additional_data: contact.additional_data || {}
          });

          clientRecords.push({
            client_id: client.id,
            phone: contact.phone,
            name: contact.name,
            upload_session_id: session.id,
            date_value: contact.date
          });

          savedRecords++;
        }
      }

      // Atualizar sessão com resultados
      const processingTime = Date.now() - startTime;
      await this.updateUploadStats(session.id, {
        status: 'completed',
        processed_records: savedRecords,
        processing_time_ms: processingTime
      });

      return {
        session_id: session.id,
        saved_records: savedRecords,
        processing_time_ms: processingTime,
        client_records: clientRecords
      };

    } catch (error) {
      if (session) {
        await this.updateUploadStatus(session.id, 'failed');
      }
      logger.error('Erro ao processar dados da planilha:', error);
      throw error;
    }
  }

  /**
   * Salva métricas do cliente
   */
  async saveClientMetrics(clientId, date, metrics) {
    try {
      const dataHash = this.generateDataHash(metrics.data);
      
      const metricRecord = {
        client_id: clientId,
        date_record: date,
        upload_session_id: metrics.upload_session_id,
        sheet_name: metrics.sheet_name,
        row_number: metrics.row_number,
        data_hash: dataHash,
        metrics: metrics.data || {},
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(this.TABLES.CLIENT_METRICS)
        .upsert(metricRecord, { 
          onConflict: 'client_id,date_record,upload_session_id' 
        });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Erro ao salvar métricas:', error);
      throw error;
    }
  }

  /**
   * Gera hash SHA256 dos dados para detecção de duplicatas
   */
  generateDataHash(data) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  /**
   * Extrai telefone dos dados do cliente
   */
  extractPhoneFromData(data) {
    if (!data) return null;
    
    const phoneFields = ['phone', 'telefone', 'celular', 'whatsapp'];
    for (const field of phoneFields) {
      if (data[field]) return data[field];
    }
    return null;
  }

  /**
   * Atualiza status do upload
   */
  async updateUploadStatus(sessionId, status) {
    try {
      const { error } = await supabase
        .from(this.TABLES.UPLOAD_SESSIONS)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      logger.error('Erro ao atualizar status:', error);
    }
  }

  /**
   * Atualiza estatísticas do upload
   */
  async updateUploadStats(sessionId, stats) {
    try {
      const { error } = await supabase
        .from(this.TABLES.UPLOAD_SESSIONS)
        .update({
          ...stats,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      logger.error('Erro ao atualizar estatísticas:', error);
    }
  }

  /**
   * Obtém todos os contatos com mensagens enviadas
   */
  async getAllSentContacts(limit = 1000, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('contacts_sent_view')
        .select('*')
        .order('sent_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Erro ao obter contatos enviados:', error);
      throw error;
    }
  }

  /**
   * Busca contatos por critérios
   */
  async searchContacts(query, filters = {}) {
    try {
      let queryBuilder = supabase
        .from(this.TABLES.CLIENTS)
        .select(`*, ${this.TABLES.SENT_CONTACTS}(*)`)
        .limit(100);

      if (query) {
        queryBuilder = queryBuilder.textSearch('search_vector', query);
      }

      if (filters.phone) {
        queryBuilder = queryBuilder.ilike('phone_normalized', `%${filters.phone}%`);
      }

      if (filters.date_from) {
        queryBuilder = queryBuilder.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        queryBuilder = queryBuilder.lte('created_at', filters.date_to);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Erro ao buscar contatos:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas do dashboard
   */
  async getDashboardStats() {
    try {
      const { data, error } = await supabase
        .from('dashboard_stats')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Erro ao obter estatísticas:', error);
      return {
        total_clients: 0,
        total_sent: 0,
        total_delivered: 0,
        pending_feedback: 0,
        successful_uploads: 0,
        uploads_30_days: 0
      };
    }
  }

  /**
   * Registra mensagem enviada
   */
  async registerSentMessage(clientId, phone, name, message, uploadSessionId = null) {
    try {
      const sentRecord = {
        client_id: clientId,
        phone: phone,
        name: name,
        message_sent: true,
        sent_at: new Date().toISOString(),
        message_content: message,
        upload_session_id: uploadSessionId,
        delivery_status: 'sent',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(this.TABLES.SENT_CONTACTS)
        .insert(sentRecord)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Erro ao registrar mensagem enviada:', error);
      throw error;
    }
  }

  /**
   * Atualiza status de entrega
   */
  async updateDeliveryStatus(contactId, status, response = null) {
    try {
      const updateData = {
        delivery_status: status,
        updated_at: new Date().toISOString()
      };

      if (response) {
        updateData.delivery_response = response;
      }

      const { error } = await supabase
        .from(this.TABLES.SENT_CONTACTS)
        .update(updateData)
        .eq('id', contactId);

      if (error) throw error;
    } catch (error) {
      logger.error('Erro ao atualizar status de entrega:', error);
      throw error;
    }
  }

  /**
   * Obtém contatos por sessão de upload
   */
  async getContactsByUploadSession(sessionId) {
    try {
      const { data, error } = await supabase
        .from(this.TABLES.SENT_CONTACTS)
        .select(`*, ${this.TABLES.CLIENTS}(display_name, phone_normalized)`)
        .eq('upload_session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Erro ao obter contatos por sessão:', error);
      throw error;
    }
  }

  /**
   * Obtém histórico de uploads
   */
  async getUploadHistory(limit = 50) {
    try {
      const { data, error } = await supabase
        .from(this.TABLES.UPLOAD_SESSIONS)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Erro ao obter histórico:', error);
      throw error;
    }
  }

  /**
   * Limpa dados antigos (manutenção)
   */
  async cleanupOldData(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Limpar sessões antigas
      const { error: sessionError } = await supabase
        .from(this.TABLES.UPLOAD_SESSIONS)
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .eq('status', 'completed');

      if (sessionError) throw sessionError;

      logger.info(`Dados antigos limpos: ${cutoffDate.toISOString()}`);
    } catch (error) {
      logger.error('Erro ao limpar dados antigos:', error);
    }
  }
}

module.exports = new SupabaseOptimizedService();