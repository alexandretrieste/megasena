# Deploy na Vercel

## 1. Criar e configurar o banco Supabase

1. Crie um projeto no [Supabase](https://supabase.com).
2. No **SQL Editor**, abra `supabase/setup.sql` deste repositório, cole o conteúdo e execute.
   - O script cria `volantes` e `system_config`, índices, validações e a configuração inicial.
   - RLS fica habilitado e o acesso de `anon`/`authenticated` é revogado. O backend usa a chave `service_role`.
   - O script remove as políticas existentes nessas duas tabelas para evitar que uma política pública antiga continue liberando dados.
   - Em banco já usado, faça backup antes. O índice de unicidade pode falhar se já existirem registros repetidos por CPF e nome (ignorando maiúsculas/minúsculas e espaços); resolva duplicatas antes de executar.
3. Em **Project Settings > API**, copie a Project URL e a chave `service_role`. A chave `service_role` é secreta e deve ficar somente nas variáveis do servidor.

Não publique CPFs por meio de políticas RLS públicas, da chave `anon` ou de endpoints sem autenticação.

## 2. Configurar segredos administrativos

Gere um hash bcrypt para a senha do painel:

```bash
node scripts/generate-password-hash.js "SuaSenhaForte123!"
```

Use uma senha com pelo menos 12 caracteres, maiúsculas, minúsculas, números e símbolos. Gere o segredo JWT localmente:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Não envie a senha nem o segredo JWT ao Git. Não reutilize os valores de exemplo.

## 3. Fazer deploy na Vercel

1. Importe o repositório no painel da Vercel.
2. Configure estas variáveis em **Settings > Environment Variables** para os ambientes necessários:
   - `SUPABASE_URL`: URL do projeto Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: chave `service_role` do Supabase. Nunca use essa chave no frontend.
   - `ADMIN_PASSWORD_HASH`: hash bcrypt produzido pelo script.
   - `JWT_SECRET`: segredo aleatório com pelo menos 32 caracteres.
3. Faça o deploy. O servidor falha ao iniciar se alguma configuração obrigatória estiver ausente ou inválida.

O limitador de login permite até 10 tentativas por IP em 15 minutos por instância. Como instâncias serverless não compartilham memória, configure também rate limiting/WAF na plataforma para defesa distribuída.

## 4. Teste final

Use um projeto de staging e dados fictícios; não use CPFs reais para testes.

1. Confirme no SQL Editor que as tabelas e a configuração foram criadas:

   ```sql
   SELECT to_regclass('public.volantes') AS volantes,
          to_regclass('public.system_config') AS system_config;

   SELECT key, value
   FROM public.system_config
   WHERE key = 'accept_new_entries';

   SELECT relrowsecurity
   FROM pg_class
   WHERE oid IN ('public.volantes'::regclass, 'public.system_config'::regclass);
   ```

2. Confirme que não há políticas permitindo acesso público:

   ```sql
   SELECT tablename, policyname, roles, cmd
   FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN ('volantes', 'system_config');
   ```

   A consulta não deve retornar linhas.

3. Execute os testes automatizados localmente:

   ```bash
   npm ci
   npm test
   ```

4. No ambiente publicado, teste estatísticas e autenticação:

   ```bash
   curl -i https://SEU-PROJETO.vercel.app/api/stats/top-numbers
   curl -i https://SEU-PROJETO.vercel.app/api/volantes/list
   ```

   Esperado: estatísticas com HTTP 200; listagem sem token com HTTP 401.

5. Pelo formulário, registre um participante de teste e confira a resposta HTTP 201 e o resultado em `volantes`. Confirme que nome/CPF não aparecem em estatísticas nem ficam acessíveis anonimamente. Remova os dados de teste ao terminar.

## Diagnóstico

- **Erro 500 na API:** confira os logs da Vercel, variáveis de ambiente e se `supabase/setup.sql` foi executado.
- **Erro de acesso ao banco:** confirme que `SUPABASE_SERVICE_ROLE_KEY` está configurada somente no backend e corresponde ao projeto da URL.
- **Login administrativo indisponível:** valide `ADMIN_PASSWORD_HASH` (bcrypt, custo mínimo 12) e `JWT_SECRET` (mínimo 32 caracteres).
- **Falha ao criar índice único em banco existente:** há registros com CPF e nome duplicados; faça backup e resolva as duplicatas antes de reaplicar o SQL.
- **Interface estática não carrega:** confira o build e as rotas em `vercel.json`.
