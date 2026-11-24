-- Dados iniciais não pessoais. Execute supabase/setup.sql para criar o schema.
INSERT INTO public.system_config (key, value)
VALUES ('accept_new_entries', true)
ON CONFLICT (key) DO NOTHING;
