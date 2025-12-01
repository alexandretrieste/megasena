const express = require('express');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { registerVolante, getStats } = require('./lib/volanteService');
const supabase = require('./lib/supabaseClient');

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
    // Verificar se o sistema está aceitando novas entradas
    const { data: config } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'accept_new_entries')
      .single();

    if (config && !config.value) {
      return res.status(403).json({ 
        error: 'O sistema não está aceitando novas sugestões no momento.' 
      });
    }

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

// Admin: Verificar status de aceitação de entradas
app.get('/api/admin/entry-status', verifyAdminToken, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'accept_new_entries')
      .single();

    if (error) {
      // Se não existir, criar com valor padrão true
      const { data: newConfig } = await supabase
        .from('system_config')
        .insert({ key: 'accept_new_entries', value: true })
        .select()
        .single();
      
      return res.json({ acceptingEntries: newConfig?.value ?? true });
    }

    res.json({ acceptingEntries: data.value });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao verificar status.' });
  }
});

// Admin: Alternar aceitação de novas entradas
app.post('/api/admin/toggle-entries', verifyAdminToken, async (req, res) => {
  try {
    const { accept } = req.body;

    const { data, error } = await supabase
      .from('system_config')
      .update({ value: accept, updated_at: new Date().toISOString() })
      .eq('key', 'accept_new_entries')
      .select()
      .single();

    if (error) throw error;

    res.json({ 
      success: true, 
      acceptingEntries: data.value,
      message: accept ? 'Sistema aceitando novas entradas.' : 'Sistema bloqueado para novas entradas.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao alterar configuração.' });
  }
});

// Admin: Zerar todos os volantes (com confirmação)
app.delete('/api/admin/reset-database', verifyAdminToken, async (req, res) => {
  try {
    const { confirmCode } = req.body;

    // Código de confirmação deve ser "ZERAR_TUDO"
    if (confirmCode !== 'ZERAR_TUDO') {
      return res.status(400).json({ 
        error: 'Código de confirmação inválido. Digite: ZERAR_TUDO' 
      });
    }

    // Deletar todos os volantes
    const { error } = await supabase
      .from('volantes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos

    if (error) throw error;

    res.json({ 
      success: true, 
      message: 'Todos os volantes foram removidos com sucesso.' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao zerar banco de dados.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

