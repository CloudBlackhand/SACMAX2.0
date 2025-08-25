#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para processar arquivo SQL e gerar versao otimizada para Railway
Corrige caracteres especiais e otimiza estrutura da tabela de produtividade
"""

import re
import os
from datetime import datetime

def corrigir_caracteres_especiais(texto):
    """Corrige caracteres especiais para compatibilidade com banco de dados"""
    substituicoes = {
        'ç': 'c', 'Ç': 'C',
        'ã': 'a', 'Ã': 'A',
        'õ': 'o', 'Õ': 'O',
        'á': 'a', 'Á': 'A',
        'à': 'a', 'À': 'A',
        'â': 'a', 'Â': 'A',
        'é': 'e', 'É': 'E',
        'è': 'e', 'È': 'E',
        'ê': 'e', 'Ê': 'E',
        'í': 'i', 'Í': 'I',
        'ì': 'i', 'Ì': 'I',
        'î': 'i', 'Î': 'I',
        'ó': 'o', 'Ó': 'O',
        'ò': 'o', 'Ò': 'O',
        'ô': 'o', 'Ô': 'O',
        'ú': 'u', 'Ú': 'U',
        'ù': 'u', 'Ù': 'U',
        'û': 'u', 'Û': 'U',
        'ñ': 'n', 'Ñ': 'N',
        'ü': 'u', 'Ü': 'U',
        'º': 'o', 'ª': 'a',
        '°': 'o',
        '–': '-', '—': '-',
        '"': '"', '"': '"',
        ''': "'", ''': "'",
        '…': '...',
        '®': '(R)',
        '©': '(C)',
        '™': '(TM)'
    }
    
    for especial, normal in substituicoes.items():
        texto = texto.replace(especial, normal)
    
    return texto

def processar_arquivo_sql(arquivo_entrada, arquivo_saida):
    """Processa o arquivo SQL e gera versao otimizada"""
    
    print(f"Processando arquivo: {arquivo_entrada}")
    
    with open(arquivo_entrada, 'r', encoding='utf-8') as f:
        conteudo = f.read()
    
    # Extrair apenas a tabela de produtividade
    padrao_produtividade = r'-- Tabela: PRODUTIVIDADE.*?-- Fim da tabela produtividade'
    match = re.search(padrao_produtividade, conteudo, re.DOTALL | re.IGNORECASE)
    
    if not match:
        print("Tabela de produtividade nao encontrada!")
        return
    
    tabela_produtividade = match.group(0)
    
    # Corrigir caracteres especiais
    tabela_corrigida = corrigir_caracteres_especiais(tabela_produtividade)
    
    # Criar header do arquivo otimizado
    header = f"""-- Script SQL otimizado para Railway
-- Tabela de Produtividade - VION
-- Data de geracao: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- Caracteres especiais corrigidos para compatibilidade
-- Arquivo original: {os.path.basename(arquivo_entrada)}

-- Criar tabela de produtividade otimizada
CREATE TABLE IF NOT EXISTS produtividade (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data DATE,
    tecnico TEXT,
    servico TEXT,
    sa TEXT,
    documento TEXT,
    nome_cliente TEXT,
    endereco TEXT,
    telefone1 TEXT,
    telefone2 TEXT,
    plano TEXT,
    status TEXT,
    obs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices para melhor performance
CREATE INDEX IF NOT EXISTS idx_produtividade_data ON produtividade(data);
CREATE INDEX IF NOT EXISTS idx_produtividade_tecnico ON produtividade(tecnico);
CREATE INDEX IF NOT EXISTS idx_produtividade_status ON produtividade(status);
CREATE INDEX IF NOT EXISTS idx_produtividade_servico ON produtividade(servico);

-- Dados da produtividade (caracteres especiais corrigidos)
"""
    
    # Extrair e processar os INSERTs
    inserts = re.findall(r'INSERT INTO produtividade.*?;', tabela_corrigida, re.DOTALL | re.IGNORECASE)
    
    # Processar cada INSERT
    inserts_processados = []
    for insert in inserts:
        # Corrigir nomes de colunas
        insert = insert.replace('servi_o', 'servico')
        insert = insert.replace('s_a', 'sa')
        insert = insert.replace('endere_o', 'endereco')
        
        # Remover aspas desnecessarias e corrigir formatos
        insert = re.sub(r"'([^']*)'", lambda m: f"'{corrigir_caracteres_especiais(m.group(1))}'", insert)
        
        inserts_processados.append(insert)
    
    # Gerar arquivo final
    conteudo_final = header + '\n'.join(inserts_processados) + '\n\n'
    
    # Adicionar comentarios finais
    comentarios_finais = """-- Comentarios sobre as correcoes realizadas:
-- 1. Caracteres especiais removidos: ç -> c, ã -> a, õ -> o, é -> e, etc.
-- 2. Estrutura otimizada com indices para melhor performance
-- 3. Campo id adicionado como chave primaria
-- 4. Campo created_at adicionado para auditoria
-- 5. Tipos de dados padronizados
-- 6. Compatibilidade com SQLite (usado pelo Railway)
-- 7. Nomes de colunas padronizados sem caracteres especiais

-- Total de registros processados: {total_registros}
-- Arquivo gerado automaticamente para deploy no Railway
""".format(total_registros=len(inserts_processados))
    
    conteudo_final += comentarios_finais
    
    # Salvar arquivo processado
    with open(arquivo_saida, 'w', encoding='utf-8') as f:
        f.write(conteudo_final)
    
    print(f"Arquivo processado salvo em: {arquivo_saida}")
    print(f"Total de registros processados: {len(inserts_processados)}")
    print("Caracteres especiais corrigidos para compatibilidade com Railway")

def main():
    """Funcao principal"""
    arquivo_entrada = 'operacoes_vion_complete.sql'
    arquivo_saida = 'railway_produtividade_completo.sql'
    
    if not os.path.exists(arquivo_entrada):
        print(f"Arquivo de entrada nao encontrado: {arquivo_entrada}")
        return
    
    try:
        processar_arquivo_sql(arquivo_entrada, arquivo_saida)
        print("\nProcessamento concluido com sucesso!")
        print("O arquivo esta pronto para ser usado no Railway.")
    except Exception as e:
        print(f"Erro durante o processamento: {e}")

if __name__ == "__main__":
    main()
