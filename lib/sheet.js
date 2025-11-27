const supabase = require('./supabaseClient');

const TABLE_NAME = 'volantes';

/**
 * Busca todas as entradas de volantes
 */
async function fetchEntries() {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('timestamp', { ascending: true });
    
    if (error) {
      throw new Error(`Erro ao buscar volantes: ${error.message}`);
    }
    
    return data.map((row) => ({
      id: row.id,
      name: row.name || '',
      cpf: row.cpf || '',
      numbers: Array.isArray(row.numbers) ? row.numbers : (row.numbers || []),
      timestamp: row.timestamp || '',
    }));
  } catch (error) {
    console.error('Erro em fetchEntries:', error);
    throw error;
  }
}

/**
 * Adiciona uma nova entrada de volante
 */
async function appendEntry(entry) {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([
        {
          name: entry.name,
          cpf: entry.cpf,
          numbers: entry.numbers,
          timestamp: entry.timestamp,
        },
      ])
      .select();
    
    if (error) {
      throw new Error(`Erro ao inserir volante: ${error.message}`);
    }
    
    return data[0];
  } catch (error) {
    console.error('Erro em appendEntry:', error);
    throw error;
  }
}

module.exports = {
  fetchEntries,
  appendEntry,
};
