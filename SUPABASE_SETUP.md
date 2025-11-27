# Migração para Supabase - Guia de Configuração

## O que foi alterado

O projeto foi migrado de **Google Sheets** para **Supabase** como banco de dados principal.

## Duas opções de Setup

### Opção 1: Usar Supabase Local com Docker (Recomendado para desenvolvimento)

**Pré-requisitos:**
- Docker instalado (https://www.docker.com/products/docker-desktop)

**Passos:**

1. Clone ou acesse o repositório:
```bash
cd megasena
```

2. Copie o arquivo de ambiente:
```bash
cp .env.example .env
```

3. Inicie os containers:
```bash
docker-compose up -d
```

Isso irá:
- Criar um container PostgreSQL
- Criar um container Supabase local
- Criar um container com sua aplicação Node.js
- Executar as migrations automaticamente
- Criar dados de exemplo

4. Acesse a aplicação:
- API: http://localhost:3000
- Supabase Dashboard: http://localhost:8000
- Banco de dados: localhost:5432

5. Parar os containers:
```bash
docker-compose down
```

**Variáveis de ambiente pré-configuradas:**
- SUPABASE_URL: `http://localhost:8000`
- SUPABASE_ANON_KEY: Token JWT pré-gerado
- PORT: `3000`

---

### Opção 2: Usar Supabase Cloud (Para produção)

**Passos:**

1. Criar conta no Supabase
- Acesse https://supabase.com
- Crie uma nova conta ou faça login
- Crie um novo projeto

2. Configurar variáveis de ambiente
- Copie o arquivo `.env.example` para `.env`
- Vá para **Project Settings** > **API** no painel do Supabase
- Copie a `URL` e cole em `SUPABASE_URL`
- Copie a chave `anon` pública e cole em `SUPABASE_ANON_KEY`

3. Instalar dependências
```bash
npm install
```

4. Executar migrations
```bash
npm run migrate
```

5. Iniciar o servidor
```bash
npm start
```

## Estrutura de dados

A tabela `volantes` possui os seguintes campos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único (gerado automaticamente) |
| name | TEXT | Nome do participante |
| cpf | TEXT | CPF do participante |
| numbers | INTEGER[] | Array com os números escolhidos |
| timestamp | TIMESTAMP | Data/hora do registro |
| created_at | TIMESTAMP | Data/hora de criação (automática) |

## Migrations

O projeto usa um sistema de migrations para gerenciar as alterações no banco de dados.

### Executar migrations
```bash
npm run migrate
```

### Reverter migrations
```bash
npm run migrate:down
```

### Migrations disponíveis
1. **001_create_volantes_table** - Cria a tabela `volantes` com índices
2. **002_create_rls_policies** - Cria as políticas de Row Level Security

Para adicionar novas migrations, edite o arquivo `lib/migrations.js`.

## Políticas de Segurança (RLS)

As políticas de segurança são criadas automaticamente pelas migrations. Para desenvolvimento/teste, as políticas permitem:
- Leitura pública da tabela `volantes`
- Escrita pública na tabela `volantes`

Para produção, você pode ajustar as políticas no painel do Supabase em **Authentication** > **Policies**.

## Migrando dados do Google Sheets

Se você tem dados no Google Sheets e quer migrá-los:

1. Exporte os dados do Sheets como CSV
2. No painel do Supabase, vá para **Table Editor**
3. Selecione a tabela `volantes` e clique em **Import data**
4. Selecione o arquivo CSV

## Arquivos modificados

- `package.json` - Substituiu `googleapis` por `@supabase/supabase-js`
- `lib/sheet.js` - Reescrito para usar Supabase ao invés de Google Sheets
- `lib/supabaseClient.js` - Novo arquivo com configuração do cliente Supabase
- `.env.example` - Novo arquivo de exemplo para variáveis de ambiente

## Variáveis de ambiente necessárias

```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima-aqui
PORT=3000 (opcional, padrão é 3000)
```

## Testando a API

### Registrar um volante
```bash
curl -X POST http://localhost:3000/api/volantes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "cpf": "123.456.789-00",
    "numbers": [1, 2, 3, 4, 5, 6]
  }'
```

### Obter estatísticas
```bash
curl http://localhost:3000/api/stats/top-numbers
```

## Suporte

Para mais informações sobre Supabase, visite: https://supabase.com/docs
