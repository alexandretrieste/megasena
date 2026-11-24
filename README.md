
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
- Docker (opcional; o banco é um projeto Supabase)
- Conta Supabase (https://supabase.com)

## 🛠️ Instalação Local

### Opção 1: Com Docker (Recomendado)

```bash
# Clone o repositório
git clone https://github.com/alexandretrieste/megasena.git
cd megasena

# Crie .env com as variáveis documentadas em DOCKER.md

# Inicie a aplicação em container
docker-compose up -d

# Acesse http://localhost:3000
```

### Opção 2: Sem Docker

```bash
# Instale as dependências
npm install

# Configure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
# ADMIN_PASSWORD_HASH e JWT_SECRET no ambiente local.

# Crie as tabelas executando supabase/setup.sql no SQL Editor do Supabase

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
SUPABASE_SERVICE_ROLE_KEY = chave-secreta-apenas-no-servidor
ADMIN_PASSWORD_HASH = hash-bcrypt-gerado-pelo-script
JWT_SECRET = segredo-aleatorio-com-pelo-menos-32-caracteres
```

### Passo 4: Deploy

Clique em "Deploy". A aplicação estará disponível em `https://seu-dominio.vercel.app`

## 🗄️ Estrutura do Banco de Dados

Tabela: `volantes`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Chave primária |
| name | TEXT | Nome do participante |
| cpf | TEXT | CPF do participante |
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

### GET /api/lottery-results/frequency
Obter a frequência de cada dezena nos 100 concursos oficiais mais recentes. O servidor inclui um snapshot local válido como fallback e tenta atualizar a partir de um CSV público uma vez a cada sete dias, com uma única requisição em vez de consultar cada concurso separadamente.

As sugestões do painel administrativo usam essas frequências como ponderação e evitam sequências de quatro ou mais dezenas consecutivas por preferência visual. Se a atualização externa falhar, o endpoint retorna o snapshot local e indica `"stale": true`. Frequências anteriores não preveem os próximos resultados: cada combinação simples de seis dezenas tem a mesma probabilidade.

Fonte do snapshot incluído: [aretw0/loterias-caixa-db](https://github.com/aretw0/loterias-caixa-db), atualizado a partir dos resultados oficiais da Caixa.

**Response:**
```json
{
  "drawCount": 100,
  "firstContest": 2990,
  "lastContest": 3089,
  "frequencies": [
    {"number": 10, "count": 15},
    {"number": 53, "count": 14}
  ]
}
```

## 🛠️ Scripts Disponíveis

```bash
npm start  # Inicia a aplicação
npm test   # Executa testes automatizados
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
├── public/
│   ├── index.html         # Frontend
│   ├── app.js             # JavaScript do frontend
│   └── style.css          # Estilos
└── supabase/
    ├── setup.sql          # Schema, validações e permissões seguras
    └── seed.sql           # Configuração inicial não pessoal
```

## 🔐 Segurança

- CPF validado com `cpf-cnpj-validator`
- Números limitados de 1 a 60
- Entre 6 e 10 números por volante
- Prevenção de duplicatas (nome + CPF, protegida também por índice único)
- Row Level Security (RLS) no Supabase
- **Painel administrativo protegido por autenticação JWT com senha armazenada em bcrypt**
- Tokens JWT com expiração de 24 horas
- Listagem de dados pessoais protegida por token administrativo

### Configurar Senha de Admin

A senha é armazenada como **hash bcrypt** no arquivo `.env` por segurança.

**Para gerar o hash de uma nova senha:**

```bash
node scripts/generate-password-hash.js "sua_senha_aqui_com_12_caracteres"
```

**Resultado:**
```
✅ Hash gerado com sucesso!

ADMIN_PASSWORD_HASH=$2b$12$...
```

**Adicione ao arquivo `.env`:**

```env
ADMIN_PASSWORD_HASH=xxxxxxxxxxxxxxxxxxxxx...
JWT_SECRET=seu_jwt_secret_muito_seguro_aqui
```

**Importante:** 
- A senha deve ter no mínimo 12 caracteres e cumprir os requisitos do gerador
- Use uma senha forte e segura
- JWT_SECRET deve ser aleatório e ter pelo menos 32 caracteres
- Em Vercel, configure JWT_SECRET como variável de ambiente
- O hash bcrypt é unidirecional - a senha não pode ser recuperada

### Banco de dados e privacidade

- Execute `supabase/setup.sql` no SQL Editor do Supabase para criar as tabelas.
- O servidor usa `SUPABASE_SERVICE_ROLE_KEY`; nunca a exponha no navegador, em commits ou em logs.
- RLS permanece habilitado sem políticas públicas, e o endpoint `/api/volantes/list` exige token administrativo.
- A chave `anon` não é usada pelo backend.

## 🧪 Testes

```bash
npm ci
npm test
```

## 📝 Licença

ISC

## 👤 Autor

Alexandre Trieste

## 📚 Referências

- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Express.js](https://expressjs.com)
