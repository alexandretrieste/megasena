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

-- Policy: Admin pode ler
CREATE POLICY "Admin can view config"
ON system_config FOR SELECT
USING (true);

-- Policy: Admin pode atualizar
CREATE POLICY "Admin can update config"
ON system_config FOR UPDATE
USING (true);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);

-- Confirmar criação
SELECT * FROM system_config;
