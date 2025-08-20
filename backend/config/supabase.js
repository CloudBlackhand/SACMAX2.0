// const { createClient } = require('@supabase/supabase-js');

// // Configurações do Supabase - REMOVIDO (usando Railway PostgreSQL)
// const SUPABASE_URL = 'https://pjkxgtygxslxvyafzvhk.supabase.co';
// const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqa3hndHlneHNseHZ5YWZ6dmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNzc2NjksImV4cCI6MjA3MDc1MzY2OX0.gPVasCXxz92xRto236qb4j42P4xog15TWYJVa0IixP8';
// const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqa3hndHlneHNseHZ5YWZ6dmtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE3NzY2OSwiZXhwIjoyMDcwNzUzNjY5fQ.YxZinJa8jiNtCqKfDTUSl6P7d1eJmqqAGQuJSwPL3MM';

// // Cliente para uso geral (anon)
// const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// // Cliente administrativo (service role) - use com cuidado!
// const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// // Retornar null para indicar que Supabase não está configurado
// module.exports = {
//   supabase: null,
//   supabaseAdmin: null,
//   SUPABASE_URL: null,
//   SUPABASE_ANON_KEY: null
// };

// Configuração para Railway PostgreSQL
const { Client } = require('pg');

// Função auxiliar para criar cliente PostgreSQL
function createRailwayClient() {
  const connectionString = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;
  if (!connectionString) {
    console.warn('DATABASE_URL não configurada para Railway PostgreSQL');
    return null;
  }
  return new Client({ connectionString });
}

module.exports = {
  createRailwayClient,
  supabase: null,
  supabaseAdmin: null,
  SUPABASE_URL: null,
  SUPABASE_ANON_KEY: null
};