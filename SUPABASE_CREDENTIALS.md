# 🔑 Como Encontrar as Credenciais do Supabase

## Passo 1: Acessar o Supabase Console

1. Acesse https://app.supabase.com
2. Faça login com sua conta
3. Selecione seu projeto

## Passo 2: Encontrar SUPABASE_URL

1. No menu lateral esquerdo, procure por **API Keys** (conforme a imagem que você mostrou)
2. Clique em **API Keys**
3. Na página que abrir, você verá **Project URL** no topo
4. Copie e cole em `SUPABASE_URL`

**Exemplo:**
```
https://seu-projeto.supabase.co
```

## Passo 3: Encontrar SUPABASE_ANON_KEY

1. Na mesma página de **API Keys**
2. Procure pela seção **Project API keys**
3. Você verá as chaves listadas:
   - **`public`** (anon) ← **ESTA É A QUE VOCÊ PRECISA**
   - `service_role`
   - `jwt_secret`

4. Clique no ícone de cópia ao lado de **`public`** para copiar a chave

**Exemplo:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNTIwNjQwMCwiZXhwIjoyMzI1NDI2MDAwfQ.v8swpWWrapwHNoGVzyngI8Go3b1D86nSrKvrAKPO9BE
```

## ✅ Resultado Final

Seu `.env` deve ficar assim:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3000
NODE_ENV=development
```

## 🔒 Segurança

⚠️ **Importante:**
- A chave **`public`** (anon) é segura para usar no frontend e `.env`
- NUNCA compartilhe a chave **`service_role`** - ela é para o backend apenas
- Se comprometer a chave, regenere-a clicando no ícone de refresh

## 📱 Localização no Supabase

Conforme a imagem que você mostrou, o menu lateral tem:

```
Supabase Settings
├── General
├── Compute and Disk
├── Infrastructure
├── Integrations
├── Data API
├── API Keys ← CLIQUE AQUI
├── JWT Keys
├── Log Drains
├── Add Ons
├── Vault (BETA)
├── Database
├── Authentication
├── Storage
├── Edge Functions
├── Subscription
└── Usage
```

**Na página API Keys, você encontra:**
- **Project URL** ← `SUPABASE_URL`
- **Project API keys > public** ← `SUPABASE_ANON_KEY`

## 🆘 Troubleshooting

**Não consigo encontrar as chaves?**
1. Certifique-se de estar no projeto correto
2. Verifique se está em **Settings > API** (não em outras abas)
3. Scroll para baixo se não vir as chaves

**Recebi erro de permissão?**
1. Verifique se está usando a chave `public` (anon), não `service_role`
2. Verifique se a URL é HTTPS (não HTTP)

**Erro de conexão?**
1. Verifique o nome do banco de dados (deve ser `megasena`)
2. Certifique-se que a tabela `volantes` foi criada
3. Teste a conexão em **SQL Editor** do Supabase
