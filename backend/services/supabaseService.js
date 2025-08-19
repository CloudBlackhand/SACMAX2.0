const { supabase, supabaseAdmin } = require('../config/supabase');
const logger = require('../utils/logger');

class SupabaseService {
  constructor() {
    this.TABLE_CLIENTS = 'clients';
    this.TABLE_SPREADSHEET_DATA = 'spreadsheet_data';
    this.TABLE_UPLOAD_HISTORY = 'upload_history';
  }

  /**
   * Cria ou atualiza um cliente no banco de dados
   * @param {Object} clientData - Dados do cliente
   * @param {string} clientData.client_id - ID único do cliente
   * @param {string} clientData.client_name - Nome do cliente
   * @param {string} clientData.phone - Telefone do cliente
   * @param {string} clientData.sheet_name - Nome da aba da planilha
   * @param {string} upload_id - ID do upload para rastreamento
   */
  async upsertClient(clientData, upload_id) {
    try {
      // Verificar se o cliente já existe
      const { data: existingClient } = await supabase
        .from(this.TABLE_CLIENTS)
        .select('id')
        .eq('client_id', clientData.client_id)
        .single();

      const clientRecord = {
        client_id: clientData.client_id,
        client_name: clientData.client_name,
        phone: clientData.phone || null,
        sheet_name: clientData.sheet_name,
        last_upload_id: upload_id,
        updated_at: new Date().toISOString()
      };

      if (existingClient) {
        // Atualizar cliente existente
        const { data, error } = await supabase
          .from(this.TABLE_CLIENTS)
          .update(clientRecord)
          .eq('id', existingClient.id)
          .select()
          .single();

        if (error) throw error;
        return { id: existingClient.id, action: 'updated', data };
      } else {
        // Criar novo cliente
        clientRecord.created_at = new Date().toISOString();
        const { data, error } = await supabase
          .from(this.TABLE_CLIENTS)
          .insert(clientRecord)
          .select()
          .single();

        if (error) throw error;
        return { id: data.id, action: 'created', data };
      }
    } catch (error) {
      logger.error('Erro ao salvar cliente:', error);
      throw error;
    }
  }

  /**
   * Salva os dados de uma planilha com prevenção de duplicação
   * @param {Object} spreadsheetData - Dados completos da planilha
   * @param {string} fileName - Nome do arquivo original
   * @param {string} mode - Modo de processamento (contacts ou client_data)
   */
  async saveSpreadsheetData(spreadsheetData, fileName, mode = 'client_data') {
    try {
      // Criar registro de upload
      const uploadRecord = await this.createUploadRecord(fileName, mode, spreadsheetData);
      
      let savedRecords = 0;
      let updatedRecords = 0;

      if (mode === 'client_data') {
        // Processar dados organizados por cliente e data
        const { client_data_by_date } = spreadsheetData;
        
        for (const [date, clients] of Object.entries(client_data_by_date)) {
          for (const [clientId, clientInfo] of Object.entries(clients)) {
            // Salvar/atualizar cliente
            const clientResult = await this.upsertClient({
              client_id: clientId,
              client_name: clientInfo.client_name,
              phone: this.extractPhoneFromData(clientInfo.data),
              sheet_name: clientInfo.sheet
            }, uploadRecord.id);

            // Salvar dados da planilha
            const spreadsheetRecord = {
              upload_id: uploadRecord.id,
              client_id: clientResult.id,
              date: date,
              sheet_name: clientInfo.sheet,
              data: JSON.stringify(clientInfo.data),
              file_name: fileName,
              mode: mode,
              created_at: new Date().toISOString()
            };

            // Verificar duplicação baseada em cliente, data e upload
            const { data: existingData } = await supabase
              .from(this.TABLE_SPREADSHEET_DATA)
              .select('id')
              .eq('client_id', clientResult.id)
              .eq('date', date)
              .eq('upload_id', uploadRecord.id)
              .single();

            if (existingData) {
              // Atualizar dados existentes
              await supabase
                .from(this.TABLE_SPREADSHEET_DATA)
                .update(spreadsheetRecord)
                .eq('id', existingData.id);
              updatedRecords++;
            } else {
              // Criar novo registro
              await supabase
                .from(this.TABLE_SPREADSHEET_DATA)
                .insert(spreadsheetRecord);
              savedRecords++;
            }
          }
        }
      } else {
        // Processar contatos
        const { contacts } = spreadsheetData;
        
        for (const contact of contacts) {
          const clientResult = await this.upsertClient({
            client_id: contact.phone || contact.name,
            client_name: contact.name,
            phone: contact.phone,
            sheet_name: contact.sheet
          }, uploadRecord.id);

          const spreadsheetRecord = {
            upload_id: uploadRecord.id,
            client_id: clientResult.id,
            phone: contact.phone,
            name: contact.name,
            date: contact.date,
            sheet_name: contact.sheet,
            data: JSON.stringify(contact.additional_data),
            file_name: fileName,
            mode: mode,
            created_at: new Date().toISOString()
          };

          await supabase
            .from(this.TABLE_SPREADSHEET_DATA)
            .insert(spreadsheetRecord);
          savedRecords++;
        }
      }

      // Atualizar estatísticas do upload
      await this.updateUploadStats(uploadRecord.id, savedRecords, updatedRecords);

      return {
        upload_id: uploadRecord.id,
        saved_records: savedRecords,
        updated_records: updatedRecords,
        total_records: savedRecords + updatedRecords
      };
    } catch (error) {
      logger.error('Erro ao salvar dados da planilha:', error);
      throw error;
    }
  }

  /**
   * Cria registro de upload para rastreamento
   */
  async createUploadRecord(fileName, mode, data) {
    try {
      const record = {
        file_name: fileName,
        mode: mode,
        upload_date: new Date().toISOString(),
        sheets_processed: data.sheets?.length || 0,
        total_records: data.total_contacts || data.total_dates || 0,
        status: 'processing',
        created_at: new Date().toISOString()
      };

      const { data: uploadData, error } = await supabase
        .from(this.TABLE_UPLOAD_HISTORY)
        .insert(record)
        .select()
        .single();

      if (error) throw error;
      return uploadData;
    } catch (error) {
      logger.error('Erro ao criar registro de upload:', error);
      throw error;
    }
  }

  /**
   * Atualiza estatísticas do upload
   */
  async updateUploadStats(uploadId, savedRecords, updatedRecords) {
    try {
      const { error } = await supabase
        .from(this.TABLE_UPLOAD_HISTORY)
        .update({
          status: 'completed',
          saved_records: savedRecords,
          updated_records: updatedRecords,
          updated_at: new Date().toISOString()
        })
        .eq('id', uploadId);

      if (error) throw error;
    } catch (error) {
      logger.error('Erro ao atualizar estatísticas:', error);
    }
  }

  /**
   * Recupera todos os clientes
   */
  async getAllClients() {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_CLIENTS)
        .select('*')
        .order('client_name');

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Erro ao buscar clientes:', error);
      throw error;
    }
  }

  /**
   * Recupera dados de um cliente específico
   */
  async getClientData(clientId) {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_SPREADSHEET_DATA)
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false });

      if (error) throw error;
      
      // Parse JSON data
      return data.map(record => ({
        ...record,
        data: typeof record.data === 'string' ? JSON.parse(record.data) : record.data
      }));
    } catch (error) {
      logger.error('Erro ao buscar dados do cliente:', error);
      throw error;
    }
  }

  /**
   * Recupera histórico de uploads
   */
  async getUploadHistory() {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_UPLOAD_HISTORY)
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Erro ao buscar histórico:', error);
      throw error;
    }
  }

  /**
   * Extrai telefone dos dados adicionais
   */
  extractPhoneFromData(dataArray) {
    if (!Array.isArray(dataArray) || dataArray.length === 0) return null;
    
    for (const item of dataArray) {
      if (item.data && item.data.Telefone) {
        return item.data.Telefone;
      }
      if (item.data && item.data.telefone) {
        return item.data.telefone;
      }
    }
    return null;
  }

  /**
   * Deleta cliente e todos os seus dados
   */
  async deleteClient(clientId) {
    try {
      // Deletar dados da planilha primeiro
      const { error: dataError } = await supabase
        .from(this.TABLE_SPREADSHEET_DATA)
        .delete()
        .eq('client_id', clientId);

      if (dataError) throw dataError;

      // Deletar cliente
      const { error: clientError } = await supabase
        .from(this.TABLE_CLIENTS)
        .delete()
        .eq('id', clientId);

      if (clientError) throw clientError;

      return { success: true };
    } catch (error) {
      logger.error('Erro ao deletar cliente:', error);
      throw error;
    }
  }
}

module.exports = new SupabaseService();