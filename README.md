
# Megasena - Sorteio de Volantes

Aplicação para registrar e gerenciar volantes de Mega Sena com análise de estatísticas.

## 🚀 Features

- ✅ Registro de volantes com validação de CPF
- ✅ Estatísticas de números mais escolhidos
- ✅ Backend em Node.js/Express
- ✅ Banco de dados Supabase (PostgreSQL)
- ✅ Interface web responsiva
- ✅ Deploy pronto para Vercel

## 📋 Pré-requisitos

- Node.js 20+ (para desenvolvimento local)
- Docker (para rodar localmente com banco de dados incluído)
- Conta Supabase (https://supabase.com)

## 🛠️ Instalação Local

### Opção 1: Com Docker (Recomendado)

```bash
# Clone o repositório
git clone https://github.com/alexandretrieste/megasena.git
cd megasena

# Copie o .env.example
cp .env.example .env

# Inicie os containers
docker-compose up -d

# Acesse http://localhost:3000
```

### Opção 2: Sem Docker

```bash
# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do Supabase

# Execute as migrations
npm run migrate

# Inicie a aplicação
npm start
```

## 📦 Deploy no Vercel

### Passo 1: Fazer Push para GitHub

```bash
git add .
git commit -m "Preparado para Vercel"
git push origin main
```

### Passo 2: Conectar ao Vercel

1. Acesse https://vercel.com
2. Clique em "New Project"
3. Selecione seu repositório GitHub
4. Clique em "Import"

### Passo 3: Configurar Variáveis de Ambiente

Na aba "Environment Variables", adicione:

```
SUPABASE_URL = https://seu-projeto.supabase.co
SUPABASE_ANON_KEY = sua-chave-anonima-aqui
```

### Passo 4: Deploy

Clique em "Deploy". A aplicação estará disponível em `https://seu-dominio.vercel.app`

## 🗄️ Estrutura do Banco de Dados

Tabela: `volantes`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Chave primária |
| name | TEXT | Nome do participante |
| cpf | TEXT | CPF (único por participante) |
| numbers | INTEGER[] | Array com os números escolhidos |
| timestamp | TIMESTAMP | Data/hora do registro |
| created_at | TIMESTAMP | Data de criação automática |

## 📡 API Endpoints

### POST /api/volantes
Registrar um novo volante

**Request:**
```json
{
  "name": "João Silva",
  "cpf": "11144477735",
  "numbers": [1, 2, 3, 4, 5, 6]
}
```

**Response:**
```json
{
  "message": "Volante registrado com sucesso."
}
```

### GET /api/stats/top-numbers
Obter estatísticas dos números mais escolhidos

**Response:**
```json
{
  "totalVolantes": 5,
  "topNumbers": [
    {"number": 1, "count": 3},
    {"number": 2, "count": 2},
    ...
  ]
}
```

## 🛠️ Scripts Disponíveis

```bash
npm start           # Inicia a aplicação
npm run migrate     # Executa migrations do banco
npm run migrate:down # Reverte migrations
```

## 📁 Estrutura do Projeto

```
megasena/
├── server.js              # Aplicação Express
├── package.json           # Dependências
├── vercel.json            # Configuração Vercel
├── docker-compose.yml     # Orquestração Docker
├── Dockerfile             # Imagem Docker
├── lib/
│   ├── supabaseClient.js  # Cliente Supabase
│   ├── sheet.js           # Operações no banco
│   ├── volanteService.js  # Lógica de negócio
│   └── migrations.js      # Migrations do banco
├── public/
│   ├── index.html         # Frontend
│   ├── app.js             # JavaScript do frontend
│   └── style.css          # Estilos
└── supabase/
    └── seed.sql           # Script de inicialização do banco
```

## 🔐 Segurança

- CPF validado com `cpf-cnpj-validator`
- Números limitados de 1 a 60
- Entre 6 e 10 números por volante
- Prevenção de duplicatas (nome + CPF)
- Row Level Security (RLS) no Supabase
- **Painel administrativo protegido por autenticação JWT com hash SHA-256**
- Tokens JWT com expiração de 24 horas
- Autenticação em localStorage com validação de token

### Configurar Senha de Admin

A senha é armazenada como **hash SHA-256** no arquivo `.env` por segurança.

**Para gerar o hash de uma nova senha:**

```bash
node scripts/generate-password-hash.js "sua_senha_aqui_com_12_caracteres"
```

**Resultado:**
```
✅ Hash gerado com sucesso!

ADMIN_PASSWORD_HASH=xxxxxxxxxxxxxxxxxxxxx...
```

**Adicione ao arquivo `.env`:**

```env
ADMIN_PASSWORD_HASH=xxxxxxxxxxxxxxxxxxxxx...
JWT_SECRET=seu_jwt_secret_muito_seguro_aqui
```

**Importante:** 
- A senha deve ter no mínimo 12 caracteres
- Use uma senha forte e segura
- JWT_SECRET deve ser uma string longa e aleatória em produção
- Em Vercel, configure JWT_SECRET como variável de ambiente
- O hash é unidirecional - a senha não pode ser recuperada

## 📝 Licença

ISC

## 👤 Autor

Alexandre Trieste

## 📚 Referências

- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Express.js](https://expressjs.com)
