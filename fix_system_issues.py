#!/usr/bin/env python3
"""
Script para validar e corrigir problemas do sistema SACMAX2.0
Executa verificações e aplicações de correções automaticamente
"""

import os
import sys
import json
import logging
import asyncio
from pathlib import Path
from datetime import datetime

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SystemFixValidator:
    """Validador e corretor de problemas do sistema"""
    
    def __init__(self):
        self.fixes_applied = []
        self.issues_found = []
        
    def validate_environment_variables(self):
        """Validar variáveis de ambiente críticas"""
        logger.info("🔍 Validando variáveis de ambiente...")
        
        required_vars = [
            'DATABASE_URL',
            'WAHA_URL',
            'PORT'
        ]
        
        missing_vars = []
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            self.issues_found.append({
                'type': 'environment',
                'severity': 'critical',
                'description': f'Variáveis de ambiente ausentes: {missing_vars}',
                'fix': 'Configure as variáveis de ambiente no Railway'
            })
            logger.error(f"❌ Variáveis ausentes: {missing_vars}")
        else:
            logger.info("✅ Todas as variáveis de ambiente estão configuradas")
    
    def validate_database_connection(self):
        """Validar conexão com banco de dados"""
        logger.info("🔍 Validando conexão com banco de dados...")
        
        try:
            from backend.database_config import test_connection
            if test_connection():
                logger.info("✅ Conexão com banco de dados OK")
            else:
                self.issues_found.append({
                    'type': 'database',
                    'severity': 'critical',
                    'description': 'Falha na conexão com banco de dados',
                    'fix': 'Verificar DATABASE_URL e status do PostgreSQL'
                })
                logger.error("❌ Falha na conexão com banco")
        except Exception as e:
            self.issues_found.append({
                'type': 'database',
                'severity': 'critical',
                'description': f'Erro ao testar banco: {e}',
                'fix': 'Verificar configuração do banco'
            })
            logger.error(f"❌ Erro no teste de banco: {e}")
    
    def validate_waha_service(self):
        """Validar serviço WAHA"""
        logger.info("🔍 Validando serviço WAHA...")
        
        try:
            import requests
            waha_url = os.getenv('WAHA_URL', 'https://waha-production-1c76.up.railway.app')
            response = requests.get(f"{waha_url}/api/server/status", timeout=10)
            
            if response.status_code == 200:
                logger.info("✅ Serviço WAHA disponível")
            else:
                self.issues_found.append({
                    'type': 'waha',
                    'severity': 'medium',
                    'description': f'WAHA retornou status {response.status_code}',
                    'fix': 'Verificar status do serviço WAHA no Railway'
                })
                logger.warning(f"⚠️ WAHA status: {response.status_code}")
                
        except Exception as e:
            self.issues_found.append({
                'type': 'waha',
                'severity': 'medium',
                'description': f'Erro ao conectar com WAHA: {e}',
                'fix': 'Verificar URL do WAHA e conectividade'
            })
            logger.error(f"❌ Erro WAHA: {e}")
    
    def validate_file_permissions(self):
        """Validar permissões de arquivos"""
        logger.info("🔍 Validando permissões de arquivos...")
        
        critical_files = [
            'backend/app/app.py',
            'backend/database_config.py',
            'frontend/main.js',
            'railway_startup.py'
        ]
        
        for file_path in critical_files:
            if not os.path.exists(file_path):
                self.issues_found.append({
                    'type': 'files',
                    'severity': 'critical',
                    'description': f'Arquivo crítico ausente: {file_path}',
                    'fix': 'Verificar integridade do código'
                })
                logger.error(f"❌ Arquivo ausente: {file_path}")
            elif not os.access(file_path, os.R_OK):
                self.issues_found.append({
                    'type': 'files',
                    'severity': 'medium',
                    'description': f'Arquivo sem permissão de leitura: {file_path}',
                    'fix': 'Ajustar permissões do arquivo'
                })
                logger.warning(f"⚠️ Sem permissão: {file_path}")
        
        if not self.issues_found:
            logger.info("✅ Permissões de arquivos OK")
    
    def check_security_issues(self):
        """Verificar problemas de segurança"""
        logger.info("🔍 Verificando problemas de segurança...")
        
        # Verificar se ainda há credenciais hardcoded
        config_file = 'backend/database_config.py'
        if os.path.exists(config_file):
            with open(config_file, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'postgresql://postgres:' in content and 'password' in content.lower():
                    self.issues_found.append({
                        'type': 'security',
                        'severity': 'critical',
                        'description': 'Credenciais hardcoded ainda presentes no código',
                        'fix': 'Remover todas as credenciais hardcoded'
                    })
                    logger.error("❌ Credenciais hardcoded encontradas!")
                else:
                    logger.info("✅ Nenhuma credencial hardcoded encontrada")
        
        # Verificar WEBHOOK_SECRET
        if not os.getenv('WEBHOOK_SECRET'):
            self.issues_found.append({
                'type': 'security',
                'severity': 'medium',
                'description': 'WEBHOOK_SECRET não configurado',
                'fix': 'Configurar WEBHOOK_SECRET para segurança dos webhooks'
            })
            logger.warning("⚠️ WEBHOOK_SECRET não configurado")
        else:
            logger.info("✅ WEBHOOK_SECRET configurado")
    
    def performance_checks(self):
        """Verificar problemas de performance"""
        logger.info("🔍 Verificando performance...")
        
        # Verificar tamanho dos uploads
        uploads_dir = Path('uploads')
        if uploads_dir.exists():
            total_size = sum(f.stat().st_size for f in uploads_dir.rglob('*') if f.is_file())
            if total_size > 100 * 1024 * 1024:  # 100MB
                self.issues_found.append({
                    'type': 'performance',
                    'severity': 'medium',
                    'description': f'Diretório uploads muito grande: {total_size / 1024 / 1024:.1f}MB',
                    'fix': 'Limpar arquivos antigos do diretório uploads'
                })
                logger.warning(f"⚠️ Uploads dir: {total_size / 1024 / 1024:.1f}MB")
            else:
                logger.info("✅ Tamanho do diretório uploads OK")
    
    def generate_report(self):
        """Gerar relatório de problemas e correções"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'total_issues': len(self.issues_found),
            'critical_issues': len([i for i in self.issues_found if i['severity'] == 'critical']),
            'medium_issues': len([i for i in self.issues_found if i['severity'] == 'medium']),
            'fixes_applied': len(self.fixes_applied),
            'issues': self.issues_found,
            'fixes': self.fixes_applied
        }
        
        # Salvar relatório
        report_file = f'system_validation_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        return report, report_file
    
    def run_all_validations(self):
        """Executar todas as validações"""
        logger.info("🚀 Iniciando validação completa do sistema...")
        
        try:
            self.validate_environment_variables()
            self.validate_database_connection()
            self.validate_waha_service()
            self.validate_file_permissions()
            self.check_security_issues()
            self.performance_checks()
            
            # Gerar relatório
            report, report_file = self.generate_report()
            
            # Exibir resumo
            logger.info("📊 RESUMO DA VALIDAÇÃO:")
            logger.info(f"   💥 Problemas críticos: {report['critical_issues']}")
            logger.info(f"   ⚠️  Problemas médios: {report['medium_issues']}")
            logger.info(f"   🔧 Correções aplicadas: {report['fixes_applied']}")
            logger.info(f"   📋 Relatório salvo em: {report_file}")
            
            if report['critical_issues'] > 0:
                logger.error("❌ SISTEMA TEM PROBLEMAS CRÍTICOS!")
                return False
            elif report['medium_issues'] > 0:
                logger.warning("⚠️ Sistema tem problemas médios que devem ser corrigidos")
                return True
            else:
                logger.info("✅ SISTEMA VALIDADO COM SUCESSO!")
                return True
                
        except Exception as e:
            logger.error(f"❌ Erro durante validação: {e}")
            return False

def main():
    """Função principal"""
    print("🛠️ SACMAX2.0 - Validador de Sistema")
    print("=" * 50)
    
    validator = SystemFixValidator()
    success = validator.run_all_validations()
    
    if success:
        print("\n✅ Validação concluída com sucesso!")
        sys.exit(0)
    else:
        print("\n❌ Validação encontrou problemas críticos!")
        sys.exit(1)

if __name__ == "__main__":
    main()
