require('dotenv').config();
const express = require('express');
const https = require('https');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('express-rate-limit');
const { registerVolante, getStats } = require('./lib/volanteService');
const supabase = require('./lib/supabaseClient');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MegaSenaAdmin/1.0' } }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (res.statusCode >= 400) {
            return reject(new Error(data?.message || `HTTP ${res.statusCode}`));
          }
          resolve(data);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_ISSUER = 'megasena-api';
const TOKEN_AUDIENCE = 'megasena-admin';

if (process.env.VERCEL === '1') {
  app.set('trust proxy', 1);
}

const passwordHashCost = ADMIN_PASSWORD_HASH.match(/^\$2[aby]\$(\d{2})\$/);
if (
  !passwordHashCost
  || Number(passwordHashCost[1]) < 12
  || !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(ADMIN_PASSWORD_HASH)
) {
  throw new Error('ADMIN_PASSWORD_HASH deve conter um hash bcrypt válido com custo mínimo 12.');
}

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET é obrigatório e deve ter pelo menos 32 caracteres.');
}

function validateAdminPassword(password) {
  const lengthValid = password.length >= 12;
  const upperValid = /[A-Z]/.test(password);
  const lowerValid = /[a-z]/.test(password);
  const digitValid = /[0-9]/.test(password);
  const specialValid = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  return lengthValid && upperValid && lowerValid && digitValid && specialValid;
}

// Middleware
app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente mais tarde.' },
});

// Middleware de autenticação para rotas admin
const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookieToken = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('admin_session='))
    ?.slice('admin_session='.length);
  const token = bearerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  jwt.verify(
    token,
    JWT_SECRET,
    {
      algorithms: ['HS256'],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    },
    (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido ou expirado.' });
      }

      if (!decoded || typeof decoded !== 'object' || decoded.admin !== true) {
        return res.status(403).json({ error: 'Token sem permissões administrativas.' });
      }

      req.admin = decoded;
      next();
    },
  );
};

// Endpoint de login - Verificação de senha
app.post('/api/admin/verify-password', adminLoginLimiter, async (req, res) => {
  const password = req.body?.password;

  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Senha obrigatória.' });
  }

  if (!validateAdminPassword(password)) {
    return res.status(400).json({
      error: 'Senha inválida. Use no mínimo 12 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.'
    });
  }

  try {
    const passwordMatches = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, error: 'Senha incorreta.' });
    }

    const token = jwt.sign(
      { admin: true },
      JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: '24h',
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
      },
    );

    res.setHeader(
      'Set-Cookie',
      `admin_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
    );
    return res.json({ success: true, token, expiresIn: 86400 });
  } catch (error) {
    console.error('Erro ao autenticar administrador:', error);
    return res.status(500).json({ error: 'Erro ao autenticar administrador.' });
  }
});

// Rota para logout (opcional - o cliente remove o token)
app.post('/api/admin/logout', (_req, res) => {
  res.setHeader(
    'Set-Cookie',
    'admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
  );
  res.json({ success: true, message: 'Logout realizado.' });
});

// Rota protegida de exemplo
app.get('/api/admin/verify-token', verifyAdminToken, (req, res) => {
  res.json({ valid: true, admin: req.admin });
});

app.post('/api/volantes', async (req, res) => {
  try {
    const { data: config, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'accept_new_entries')
      .maybeSingle();

    if (error) throw error;
    if (!config) {
      return res.status(503).json({ error: 'Configuração do sistema indisponível.' });
    }

    if (!config.value) {
      return res.status(403).json({
        error: 'O sistema não está aceitando novas sugestões no momento.',
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

app.get('/api/volantes/list', verifyAdminToken, async (_req, res) => {
  try {
    const { fetchEntries } = require('./lib/sheet');
    const volantes = await fetchEntries();
    res.json(volantes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar volantes.' });
  }
});

// Proxy para buscar resultado oficial da Mega-Sena de API externa
app.get('/api/lottery-results', async (_req, res) => {
  try {
    const data = await fetchJson('https://api.guidi.dev.br/loteria/megasena/ultimo');
    res.json(data);
  } catch (error) {
    console.error('Erro ao consultar API externa de loteria:', error);
    res.status(502).json({ error: 'Erro ao consultar resultados oficiais da Mega-Sena.' });
  }
});

// Admin: Verificar status de aceitação de entradas
app.get('/api/admin/entry-status', verifyAdminToken, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'accept_new_entries')
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Configuração accept_new_entries não encontrada.');

    res.json({ acceptingEntries: data.value });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao verificar status.' });
  }
});

// Admin: Alternar aceitação de novas entradas
app.post('/api/admin/toggle-entries', verifyAdminToken, async (req, res) => {
  try {
    const { accept } = req.body || {};
    if (typeof accept !== 'boolean') {
      return res.status(400).json({ error: 'O campo accept deve ser booleano.' });
    }

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

async function deleteAllVolantes() {
  const { error } = await supabase
    .from('volantes')
    .delete()
    .not('id', 'is', null);

  if (error) throw error;
}

async function resetSystemConfigDefault() {
  const { error } = await supabase
    .from('system_config')
    .upsert(
      [{ key: 'accept_new_entries', value: true }],
      { onConflict: 'key' }
    );

  if (error) throw error;
}

// Admin: Zerar apenas os volantes/participantes
app.delete('/api/admin/reset-volantes', verifyAdminToken, async (req, res) => {
  try {
    const { confirmCode } = req.body || {};

    if (!['ZERAR_VOLANTES', 'ZERAR_PARTICIPANTES'].includes(confirmCode)) {
      return res.status(400).json({ 
        error: 'Código de confirmação inválido. Use ZERAR_VOLANTES ou ZERAR_PARTICIPANTES.' 
      });
    }

    await deleteAllVolantes();

    res.json({ 
      success: true, 
      message: 'Todos os volantes/participantes foram removidos com sucesso.' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao zerar volantes.' });
  }
});

// Admin: Zerar tudo e restaurar configurações básicas
app.delete('/api/admin/reset-database', verifyAdminToken, async (req, res) => {
  try {
    const { confirmCode } = req.body || {};

    if (confirmCode !== 'ZERAR_TUDO') {
      return res.status(400).json({ 
        error: 'Código de confirmação inválido. Digite: ZERAR_TUDO' 
      });
    }

    await deleteAllVolantes();
    await resetSystemConfigDefault();

    res.json({ 
      success: true, 
      message: 'Todos os dados foram removidos e as configurações foram reiniciadas.' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao zerar banco de dados.' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

module.exports = app;
