const { createRailwayClient } = require('../config/supabase');
const logger = require('../utils/logger');

class FeedbackService {
    constructor() {
        this.table = 'customer_feedback';
        this.templatesTable = 'message_templates';
        this.responsesTable = 'feedback_responses';
        this.chatsTable = 'active_chats';
        this.messagesTable = 'chat_messages';
        this.campaignsTable = 'mass_campaigns';
    }

    // Categorização automática de feedback
    async categorizeFeedback(message) {
        try {
            // Análise simples de sentimentos baseada em palavras-chave
            const positiveWords = ['ótimo', 'excelente', 'bom', 'maravilhoso', 'perfeito', 'satisfeito', 'feliz', 'bom serviço', 'recomendo', 'parabéns'];
            const negativeWords = ['ruim', 'péssimo', 'horrível', 'terrível', 'insatisfeito', 'problema', 'reclamação', 'demora', 'erro', 'defeito', 'queixa'];
            
            const lowerMessage = message.toLowerCase();
            let positiveScore = 0;
            let negativeScore = 0;
            
            positiveWords.forEach(word => {
                if (lowerMessage.includes(word)) positiveScore++;
            });
            
            negativeWords.forEach(word => {
                if (lowerMessage.includes(word)) negativeScore++;
            });
            
            let category = 'neutral';
            let sentimentScore = 0.0;
            
            if (positiveScore > negativeScore) {
                category = 'positive';
                sentimentScore = Math.min(positiveScore / 3, 1.0);
            } else if (negativeScore > positiveWords) {
                category = 'negative';
                sentimentScore = -Math.min(negativeScore / 3, 1.0);
            }
            
            return { category, sentimentScore };
        } catch (error) {
            logger.error('Erro na categorização de feedback:', error);
            return { category: 'neutral', sentimentScore: 0.0 };
        }
    }

    // Adicionar novo feedback
    async addFeedback(clientId, message, source = 'whatsapp', isManual = false) {
        try {
            const { category, sentimentScore } = await this.categorizeFeedback(message);
            
            const { data, error } = await supabase
                .from(this.table)
                .insert({
                    client_id: clientId,
                    message,
                    category,
                    sentiment_score: sentimentScore,
                    source,
                    is_manual: isManual
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Erro ao adicionar feedback:', error);
            throw error;
        }
    }

    // Buscar feedbacks com filtros
    async getFeedback(filters = {}) {
        try {
            let query = supabase
                .from(this.table)
                .select(`*, clients(client_name, phone, additional_info)`)
                .order('created_at', { ascending: false });

            if (filters.category) {
                query = query.eq('category', filters.category);
            }

            if (filters.clientId) {
                query = query.eq('client_id', filters.clientId);
            }

            if (filters.dateFrom) {
                query = query.gte('created_at', filters.dateFrom);
            }

            if (filters.dateTo) {
                query = query.lte('created_at', filters.dateTo);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Erro ao buscar feedback:', error);
            throw error;
        }
    }

    // Atualizar categoria do feedback
    async updateFeedbackCategory(feedbackId, category, isManual = true) {
        try {
            const { data, error } = await supabase
                .from(this.table)
                .update({ category, is_manual: isManual })
                .eq('id', feedbackId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Erro ao atualizar categoria:', error);
            throw error;
        }
    }

    // Templates de mensagens
    async getMessageTemplates(category = null) {
        try {
            // Sempre usar templates padrão pois Supabase foi removido
            console.log('Usando templates padrão (Supabase não configurado)');
            return this.getDefaultTemplates();
        } catch (error) {
            logger.error('Erro ao buscar templates:', error.message);
            return this.getDefaultTemplates();
        }
    }

    // Templates padrão quando Supabase não está disponível
    getDefaultTemplates() {
        return [
            {
                id: 'default_thanks',
                name: 'Agradecimento Simples',
                category: 'positive',
                template: 'Obrigado pelo seu feedback, {{client_name}}!',
                variables: ['client_name']
            },
            {
                id: 'default_followup',
                name: 'Acompanhamento',
                category: 'neutral',
                template: 'Olá {{client_name}}, gostaríamos de entender melhor seu feedback.',
                variables: ['client_name']
            },
            {
                id: 'default_apology',
                name: 'Desculpas',
                category: 'negative',
                template: 'Lamentamos {{client_name}}, vamos melhorar!',
                variables: ['client_name']
            }
        ];
    }

    async createMessageTemplate(name, category, template, variables = []) {
        try {
            const { data, error } = await supabase
                .from(this.templatesTable)
                .insert({ name, category, template, variables })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Erro ao criar template:', error);
            throw error;
        }
    }

    // Gerar resposta baseada em template
    async generateResponse(clientId, templateId, feedbackMessage, customData = {}) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase não configurado - não é possível gerar resposta');
            }

            const [template, client] = await Promise.all([
                this.supabase.from(this.templatesTable).select('*').eq('id', templateId).single(),
                this.supabase.from('clients').select('*').eq('id', clientId).single()
            ]);

            if (template.error) throw template.error;
            if (client.error) throw client.error;

            let response = template.data.template;
            const data = {
                client_name: client.data.client_name,
                ...customData
            };

            // Substituir variáveis no template
            Object.keys(data).forEach(key => {
                response = response.replace(new RegExp(`{{${key}}}`, 'g'), data[key] || '');
            });

            return response;
        } catch (error) {
            logger.error('Erro ao gerar resposta:', error);
            throw error;
        }
    }

    // Sistema de chat
    async startChat(clientId) {
        try {
            const { data, error } = await supabase
                .from(this.chatsTable)
                .insert({ client_id: clientId })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Erro ao iniciar chat:', error);
            throw error;
        }
    }

    async getChatHistory(clientId) {
        try {
            const { data, error } = await supabase
                .from(this.chatsTable)
                .select(`*, chat_messages(*), clients(*)`)
                .eq('client_id', clientId)
                .order('started_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Erro ao buscar histórico:', error);
            throw error;
        }
    }

    async sendChatMessage(chatId, sender, message, messageType = 'text') {
        try {
            const { data, error } = await supabase
                .from(this.messagesTable)
                .insert({
                    chat_id: chatId,
                    sender,
                    message,
                    message_type: messageType
                })
                .select()
                .single();

            if (error) throw error;

            // Atualizar última mensagem do chat
            await supabase
                .from(this.chatsTable)
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', chatId);

            return data;
        } catch (error) {
            logger.error('Erro ao enviar mensagem:', error);
            throw error;
        }
    }

    // Campanhas de mensagens em massa
    async createMassCampaign(name, templateId, messageContent, targetFilter = {}) {
        try {
            const { data, error } = await supabase
                .from(this.campaignsTable)
                .insert({
                    name,
                    template_id: templateId,
                    message_content: messageContent,
                    target_filter: targetFilter
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Erro ao criar campanha:', error);
            throw error;
        }
    }

    async getCampaignTargets(campaignId) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase não configurado - não é possível buscar alvos da campanha');
            }

            const campaign = await this.supabase
                .from(this.campaignsTable)
                .select('*')
                .eq('id', campaignId)
                .single();

            if (campaign.error) throw campaign.error;

            const filter = campaign.data.target_filter;
            let query = this.supabase.from('clients').select('*');

            // Aplicar filtros
            if (filter.region) {
                query = query.ilike('additional_info->>region', `%${filter.region}%`);
            }

            if (filter.dateFrom) {
                query = query.gte('created_at', filter.dateFrom);
            }

            if (filter.dateTo) {
                query = query.lte('created_at', filter.dateTo);
            }

            const { data, error } = await query;
            if (error) throw error;

            return data;
        } catch (error) {
            logger.error('Erro ao buscar alvos:', error);
            throw error;
        }
    }

    async executeMassCampaign(campaignId) {
        try {
            const targets = await this.getCampaignTargets(campaignId);
            const campaign = await supabase
                .from(this.campaignsTable)
                .select('*')
                .eq('id', campaignId)
                .single();

            if (campaign.error) throw campaign.error;

            let sentCount = 0;
            let failedCount = 0;

            for (const client of targets) {
                try {
                    const personalizedMessage = campaign.data.message_content
                        .replace(/{{client_name}}/g, client.client_name)
                        .replace(/{{phone}}/g, client.phone);

                    // Aqui você integraria com o serviço WhatsApp
                    // Por enquanto, apenas registramos como enviado
                    await supabase
                        .from('campaign_contacts')
                        .insert({
                            campaign_id: campaignId,
                            client_id: client.id,
                            status: 'sent',
                            sent_at: new Date().toISOString()
                        });

                    sentCount++;
                } catch (error) {
                    await supabase
                        .from('campaign_contacts')
                        .insert({
                            campaign_id: campaignId,
                            client_id: client.id,
                            status: 'failed',
                            error_message: error.message
                        });
                    failedCount++;
                }
            }

            await supabase
                .from(this.campaignsTable)
                .update({
                    status: 'completed',
                    sent_contacts: sentCount,
                    failed_contacts: failedCount,
                    completed_at: new Date().toISOString()
                })
                .eq('id', campaignId);

            return { success: true, sentCount, failedCount };
        } catch (error) {
            logger.error('Erro ao executar campanha:', error);
            throw error;
        }
    }

    // Estatísticas de feedback
    async getFeedbackStats() {
        try {
            // Retornar estatísticas padrão quando Supabase não estiver configurado
            if (!this.supabase) {
                return {
                    total: 0,
                    byCategory: {},
                    recent: []
                };
            }

            const [total, allFeedback, recent] = await Promise.all([
                this.supabase.from(this.table).select('count', { count: 'exact' }),
                this.supabase.from(this.table).select('category'),
                this.supabase.from(this.table).select('*').limit(10).order('created_at', { ascending: false })
            ]);

            // Agrupar manualmente por categoria
            const categoryCounts = {};
            if (allFeedback.data) {
                allFeedback.data.forEach(item => {
                    const category = item.category || 'uncategorized';
                    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                });
            }

            const byCategory = Object.entries(categoryCounts).map(([category, count]) => ({
                category,
                count
            }));

            return {
                total: total.data?.[0]?.count || 0,
                byCategory,
                recent: recent.data || []
            };
        } catch (error) {
            logger.error('Erro ao buscar estatísticas:', error);
            throw error;
        }
    }

    // Salvar apenas respostas aos feedbacks (não salva mensagens de chat)
    async saveFeedbackResponse({ contactId, contactName, response, timestamp, type }) {
        try {
            const { data, error } = await supabase
                .from('feedback_responses')
                .insert({
                    contact_id: contactId,
                    contact_name: contactName,
                    response: response,
                    response_type: type || 'whatsapp_response',
                    created_at: timestamp || new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            
            logger.info('Resposta ao feedback salva:', { contactId, contactName });
            return data;
        } catch (error) {
            logger.error('Erro ao salvar resposta ao feedback:', error);
            
            // Fallback: salvar em arquivo local se Supabase não estiver disponível
            const fs = require('fs');
            const path = require('path');
            const responsesFile = path.join(__dirname, '..', 'data', 'feedback_responses.json');
            
            // Criar diretório se não existir
            const dataDir = path.dirname(responsesFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            // Ler arquivo existente ou criar novo
            let responses = [];
            if (fs.existsSync(responsesFile)) {
                try {
                    responses = JSON.parse(fs.readFileSync(responsesFile, 'utf8'));
                } catch (e) {
                    responses = [];
                }
            }
            
            // Adicionar nova resposta
            const newResponse = {
                id: Date.now(),
                contact_id: contactId,
                contact_name: contactName,
                response: response,
                response_type: type || 'whatsapp_response',
                created_at: timestamp || new Date().toISOString()
            };
            
            responses.push(newResponse);
            fs.writeFileSync(responsesFile, JSON.stringify(responses, null, 2));
            
            return newResponse;
        }
    }
}

module.exports = new FeedbackService();