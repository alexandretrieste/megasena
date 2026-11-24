# Executar com Docker

O container executa apenas a aplicação Node.js. O banco é o projeto Supabase configurado em `.env`; o PostgreSQL local que existia no Compose não era usado pelo cliente da aplicação.

## Preparar ambiente

1. Crie o projeto Supabase e execute `supabase/setup.sql` no SQL Editor.
2. Crie um arquivo `.env` na raiz com os valores secretos:

   ```env
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=chave-service-role-secreta
   ADMIN_PASSWORD_HASH=hash-bcrypt-gerado
   JWT_SECRET=segredo-aleatorio-com-pelo-menos-32-caracteres
   NODE_ENV=production
   PORT=3000
   ```

3. Gere `ADMIN_PASSWORD_HASH` com `node scripts/generate-password-hash.js "SuaSenhaForte123!"` e `JWT_SECRET` com `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.

Nunca faça commit do `.env` nem exponha a chave `service_role`.

## Comandos

```bash
docker compose up -d --build
docker compose logs -f app
docker compose down
```

Aplicação: http://localhost:3000
