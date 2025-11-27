const { getStats } = require('../../lib/volanteService');

module.exports = async (_req, res) => {
  try {
    const stats = await getStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Erro em /api/stats/top-numbers:', error);
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Erro ao carregar estatísticas.';
    res.status(500).json({ error: errorMessage });
  }
};

