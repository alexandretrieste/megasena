# ✅ Checklist de Deploy - Vercel

## Antes do Deploy

- [x] Código commitado no GitHub
- [x] `.env.production.example` com variáveis necessárias
- [x] `vercel.json` configurado
- [x] `README.md` com instruções
- [x] Dependências ajustadas (removido `pg` para Vercel)
- [x] Aplicação testada localmente

## Configurar Supabase

- [ ] Criar conta em https://supabase.com
- [ ] Criar novo projeto Supabase
- [ ] Ir para **SQL Editor** e executar:

```sql
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

ALTER TABLE volantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view volantes"
ON volantes FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert volantes"
ON volantes FOR INSERT
WITH CHECK (true);
```

- [ ] Copiar `SUPABASE_URL` de **Settings > API**
- [ ] Copiar `SUPABASE_ANON_KEY` (chave pública)

## Deploy no Vercel

1. [ ] Fazer push no GitHub
   ```bash
   git add .
   git commit -m "Pronto para Vercel"
   git push origin main
   ```

2. [ ] Acessar https://vercel.com e fazer login

3. [ ] Clicar em "Add New..." > "Project"

4. [ ] Selecionar o repositório `megasena`

5. [ ] Em "Environment Variables", adicionar:
   - `SUPABASE_URL` = cole a URL do Supabase
   - `SUPABASE_ANON_KEY` = cole a chave anonima

6. [ ] Clicar em "Deploy"

7. [ ] Aguardar conclusão (cerca de 2-3 minutos)

## Após Deploy

- [ ] Testar API: `https://seu-projeto.vercel.app/api/stats/top-numbers`
- [ ] Testar interface: `https://seu-projeto.vercel.app`
- [ ] Registrar um volante teste
- [ ] Verificar estatísticas

## URLs Importantes

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Console**: https://app.supabase.com
- **GitHub Repository**: https://github.com/alexandretrieste/megasena

## Troubleshooting

### Erro 500 na API
- Verificar `SUPABASE_URL` e `SUPABASE_ANON_KEY` no Vercel
- Verificar se a tabela foi criada no Supabase

### Conexão recusada
- Verificar se a tabela `volantes` existe
- Verificar RLS policies no Supabase

### Frontend não carrega
- Verificar se `public/` está sendo servido
- Verificar `vercel.json` routes

## 🎉 Sucesso!

Se tudo funcionou, sua aplicação está rodando em produção!

Acesse: `https://seu-projeto.vercel.app`
