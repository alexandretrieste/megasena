const { cpf: cpfValidator } = require('cpf-cnpj-validator');
const {
  appendEntry,
  fetchNumberEntries,
  findEntriesByCpf,
} = require('./sheet');

function cleanCpf(rawCpf = '') {
  return rawCpf.replace(/\D/g, '');
}

function validateSubmission(payload = {}, existingEntries = []) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, error: 'Nome, CPF e números são obrigatórios.' };
  }

  const { name, cpf, numbers } = payload;

  if (typeof name !== 'string' || typeof cpf !== 'string' || !Array.isArray(numbers)) {
    return { ok: false, error: 'Nome, CPF e números são obrigatórios.' };
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 3 || trimmedName.length > 120) {
    return { ok: false, error: 'Nome deve ter entre 3 e 120 caracteres.' };
  }

  const clean = cleanCpf(cpf);
  if (!cpfValidator.isValid(clean)) {
    return { ok: false, error: 'CPF inválido.' };
  }

  if (numbers.length < 6 || numbers.length > 10) {
    return { ok: false, error: 'É permitido escolher entre 6 e 10 números.' };
  }

  const uniqueNumbers = numbers.map(Number);

  if (
    uniqueNumbers.some((number) => !Number.isInteger(number) || number < 1 || number > 60)
    || new Set(uniqueNumbers).size !== uniqueNumbers.length
  ) {
    return { ok: false, error: 'Não repita números e use apenas valores entre 1 e 60.' };
  }

  const duplicate = existingEntries.find(
    (entry) => entry.cpf === clean
      && typeof entry.name === 'string'
      && entry.name.trim().toLowerCase() === trimmedName.toLowerCase(),
  );
  if (duplicate) {
    return { ok: false, error: 'Este nome e CPF já possuem um volante registrado.' };
  }

  return {
    ok: true,
    value: {
      name: trimmedName,
      cpf: clean,
      numbers: uniqueNumbers.sort((a, b) => a - b),
    },
  };
}

async function registerVolante(payload) {
  const validation = validateSubmission(payload);
  if (!validation.ok) {
    return validation;
  }

  const existingEntries = await findEntriesByCpf(validation.value.cpf);
  const duplicate = existingEntries.some(
    (entry) => entry.name.trim().toLowerCase() === validation.value.name.toLowerCase(),
  );
  if (duplicate) {
    return { ok: false, error: 'Este nome e CPF já possuem um volante registrado.' };
  }

  const entry = {
    ...validation.value,
    timestamp: new Date().toISOString(),
  };

  try {
    await appendEntry(entry);
  } catch (error) {
    if (error.code === '23505') {
      return { ok: false, error: error.message };
    }
    throw error;
  }
  return { ok: true, value: entry };
}

async function getStats() {
  const entries = await fetchNumberEntries();
  const frequency = new Map();

  entries.forEach((entry) => {
    entry.numbers.forEach((number) => {
      if (!Number.isFinite(number)) return;
      frequency.set(number, (frequency.get(number) || 0) + 1);
    });
  });

  const topNumbers = [...frequency.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 10)
    .map(([number, count]) => ({ number, count }));

  return {
    totalVolantes: entries.length,
    topNumbers,
  };
}

module.exports = {
  registerVolante,
  getStats,
  validateSubmission,
};






