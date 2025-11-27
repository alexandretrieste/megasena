const { registerVolante } = require('../lib/volanteService');

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(new Error('JSON inválido.'));
      }
    });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  try {
    const body = await parseBody(req);
    const result = await registerVolante(body || {});
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(201).json({ message: 'Volante registrado com sucesso.' });
  } catch (error) {
    console.error('Erro em /api/volantes:', error);
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Erro interno ao registrar volante.';
    res.status(500).json({ error: errorMessage });
  }
};

