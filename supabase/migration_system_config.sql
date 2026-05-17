-- Migration: Adicionar tabela de configurações do sistema
-- Execute este SQL no Supabase Dashboard: https://app.supabase.com
-- SQL Editor → New Query → Cole este código → Run

-- Criar tabela de configurações
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir configuração inicial (aceitar novas entradas = true)
INSERT INTO system_config (key, value)
VALUES ('accept_new_entries', true)
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Remove permissive policies (if present) and create admin-only policies
DROP POLICY IF EXISTS "Admin can view config" ON system_config;
DROP POLICY IF EXISTS "Admin can update config" ON system_config;

-- Policy: Apenas usuários com claim JWT `role = 'admin'` podem visualizar
CREATE POLICY "Admins can view config"
ON system_config FOR SELECT
USING (current_setting('jwt.claims.role', true) = 'admin');

-- Policy: Apenas usuários com claim JWT `role = 'admin'` podem atualizar
CREATE POLICY "Admins can update config"
ON system_config FOR UPDATE
USING (current_setting('jwt.claims.role', true) = 'admin');

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);

-- Confirmar criação
SELECT * FROM system_config;
