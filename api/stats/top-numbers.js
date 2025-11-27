const { getStats } = require('../../lib/volanteService');

module.exports = async (_req, res) => {
  try {
    const stats = await getStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar estatísticas.' });
  }
};

