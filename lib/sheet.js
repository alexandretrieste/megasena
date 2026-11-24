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

async function findEntriesByCpf(cpf) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('name')
    .eq('cpf', cpf);

  if (error) {
    throw new Error(`Erro ao verificar CPF: ${error.message}`);
  }

  return data;
}

async function fetchNumberEntries() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('numbers');

  if (error) {
    throw new Error(`Erro ao buscar números dos volantes: ${error.message}`);
  }

  return data;
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
      if (error.code === '23505') {
        const duplicateError = new Error('Este nome e CPF já possuem um volante registrado.');
        duplicateError.code = error.code;
        throw duplicateError;
      }
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
  findEntriesByCpf,
  fetchNumberEntries,
  appendEntry,
};
