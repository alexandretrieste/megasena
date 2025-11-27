-- Seed para Supabase local
-- Este arquivo é executado automaticamente quando o container inicia

CREATE TABLE IF NOT EXISTS volantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  numbers INTEGER[] NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_volantes_cpf ON volantes(cpf);
CREATE INDEX IF NOT EXISTS idx_volantes_timestamp ON volantes(timestamp);

-- Enable Row Level Security
ALTER TABLE volantes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view volantes"
ON volantes FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert volantes"
ON volantes FOR INSERT
WITH CHECK (true);

-- Inserir dados de exemplo (opcional)
INSERT INTO volantes (name, cpf, numbers, timestamp)
VALUES 
  ('João Silva', '12345678901', ARRAY[1, 2, 3, 4, 5, 6], NOW()),
  ('Maria Santos', '98765432101', ARRAY[10, 20, 30, 40, 50, 60], NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;
