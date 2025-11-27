const express = require('express');
const path = require('path');
const { registerVolante, getStats } = require('./lib/volanteService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

