# Docker Compose - Megasena com Supabase

## Comandos Úteis

### Iniciar tudo
```bash
docker-compose up -d
```

### Parar tudo
```bash
docker-compose down
```

### Ver logs
```bash
docker-compose logs -f
```

### Ver logs da aplicação
```bash
docker-compose logs -f app
```

### Ver logs do Supabase
```bash
docker-compose logs -f supabase
```

### Acessar o banco de dados PostgreSQL
```bash
docker exec -it megasena-postgres psql -U postgres -d postgres
```

### Reconstruir a imagem da aplicação
```bash
docker-compose build
```

### Reconstruir e reiniciar
```bash
docker-compose up -d --build
```

## URLs de Acesso

| Serviço | URL | Credenciais |
|---------|-----|------------|
| Aplicação | http://localhost:3000 | - |
| Supabase Dashboard | http://localhost:8000 | - |
| PostgreSQL | localhost:5432 | user: `postgres`, password: `postgres` |

## Estrutura do docker-compose

- **postgres**: Banco de dados PostgreSQL
- **supabase**: Serviço Supabase local
- **app**: Aplicação Node.js

## Variáveis de Ambiente

As variáveis de ambiente estão configuradas automaticamente no `docker-compose.yml`.
Para alterá-las, edite o arquivo ou crie um `.env` local.

## Troubleshooting

### Porta já em uso
Se a porta 3000, 8000 ou 5432 já está em uso, modifique no `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Mudar para 3001
```

### Container não inicia
```bash
docker-compose down -v  # Remove volumes
docker-compose up -d    # Inicia novamente
```

### Limpar tudo
```bash
docker-compose down -v
docker system prune -a
```
