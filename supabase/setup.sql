CREATE OR REPLACE FUNCTION public.valid_volante_numbers(p_numbers integer[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT cardinality(p_numbers) BETWEEN 6 AND 10
    AND cardinality(p_numbers) = (
      SELECT count(DISTINCT number)
      FROM unnest(p_numbers) AS numbers(number)
    )
    AND p_numbers <@ ARRAY(SELECT generate_series(1, 60));
$$;

CREATE TABLE IF NOT EXISTS public.volantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cpf text NOT NULL CONSTRAINT volantes_cpf_valid CHECK (cpf ~ '^[0-9]{11}$'),
  numbers integer[] NOT NULL
    CONSTRAINT volantes_numbers_valid CHECK (public.valid_volante_numbers(numbers)),
  "timestamp" timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT volantes_name_valid CHECK (length(btrim(name)) BETWEEN 3 AND 120)
);

CREATE TABLE IF NOT EXISTS public.system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.system_config (key, value)
VALUES ('accept_new_entries', true)
ON CONFLICT (key) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.volantes'::regclass
      AND conname = 'volantes_cpf_valid'
  ) THEN
    ALTER TABLE public.volantes
      ADD CONSTRAINT volantes_cpf_valid CHECK (cpf ~ '^[0-9]{11}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.volantes'::regclass
      AND conname = 'volantes_numbers_valid'
  ) THEN
    ALTER TABLE public.volantes
      ADD CONSTRAINT volantes_numbers_valid
      CHECK (public.valid_volante_numbers(numbers));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.volantes'::regclass
      AND conname = 'volantes_name_valid'
  ) THEN
    ALTER TABLE public.volantes
      ADD CONSTRAINT volantes_name_valid
      CHECK (length(btrim(name)) BETWEEN 3 AND 120);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_volantes_timestamp
  ON public.volantes ("timestamp");

CREATE INDEX IF NOT EXISTS idx_volantes_cpf
  ON public.volantes (cpf);

CREATE UNIQUE INDEX IF NOT EXISTS idx_volantes_cpf_name_unique
  ON public.volantes (cpf, lower(btrim(name)));

ALTER TABLE public.volantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy record;
BEGIN
  FOR policy IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('volantes', 'system_config')
  LOOP
    EXECUTE format(
      'DROP POLICY %I ON %I.%I',
      policy.policyname,
      policy.schemaname,
      policy.tablename
    );
  END LOOP;
END;
$$;

REVOKE ALL ON public.volantes, public.system_config FROM anon, authenticated;
GRANT ALL ON public.volantes, public.system_config TO service_role;
REVOKE ALL ON FUNCTION public.valid_volante_numbers(integer[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.valid_volante_numbers(integer[]) TO service_role;
