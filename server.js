const express = require('express');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { registerVolante, getStats } = require('./lib/volanteService');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de autenticação
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || 
  crypto.createHash('sha256').update('123456789012').digest('hex');
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// Função para gerar hash SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de autenticação para rotas admin
const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
    req.admin = decoded;
    next();
  });
};

// Endpoint de login - Verificação de senha
app.post('/api/admin/verify-password', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Senha obrigatória.' });
  }

  if (password.length < 12) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 12 caracteres.' });
  }

  // Comparar com hash da senha
  const passwordHash = hashPassword(password);
  
  if (passwordHash === ADMIN_PASSWORD_HASH) {
    // Gerar JWT token com expiração de 24 horas
    const token = jwt.sign(
      { admin: true, iat: Math.floor(Date.now() / 1000) },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return res.json({
      success: true,
      token: token,
      expiresIn: 86400, // 24 horas em segundos
    });
  }

  return res.status(401).json({ success: false, error: 'Senha incorreta.' });
});

// Rota para logout (opcional - o cliente remove o token)
app.post('/api/admin/logout', (_req, res) => {
  res.json({ success: true, message: 'Logout realizado.' });
});

// Rota protegida de exemplo
app.get('/api/admin/verify-token', verifyAdminToken, (req, res) => {
  res.json({ valid: true, admin: req.admin });
});

app.post('/api/volantes', async (req, res) => {
  try {
    const result = await registerVolante(req.body || {});
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(201).json({ message: 'Volante registrado com sucesso.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno ao registrar volante.' });
  }
});

app.get('/api/stats/top-numbers', async (_req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar estatísticas.' });
  }
});

app.get('/api/volantes/list', async (_req, res) => {
  try {
    const { fetchEntries } = require('./lib/sheet');
    const volantes = await fetchEntries();
    res.json(volantes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar volantes.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

