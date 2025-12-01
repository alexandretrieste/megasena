const { cpf: cpfValidator } = require('cpf-cnpj-validator');
const { fetchEntries, appendEntry } = require('./sheet');

function cleanCpf(rawCpf = '') {
  return rawCpf.replace(/\D/g, '');
}

function validateSubmission(payload = {}, existingEntries = []) {
  const { name, cpf, numbers } = payload;

  if (!name || !cpf || !Array.isArray(numbers)) {
    return { ok: false, error: 'Nome, CPF e números são obrigatórios.' };
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 3) {
    return { ok: false, error: 'Nome deve ter pelo menos 3 caracteres.' };
  }

  const clean = cleanCpf(cpf);
  if (!cpfValidator.isValid(clean)) {
    return { ok: false, error: 'CPF inválido.' };
  }

  const uniqueNumbers = [...new Set(numbers.map(Number))].filter(
    (n) => Number.isInteger(n) && n >= 1 && n <= 60,
  );

  if (uniqueNumbers.length !== numbers.length) {
    return { ok: false, error: 'Não repita números e use apenas valores entre 1 e 60.' };
  }

  if (uniqueNumbers.length < 6 || uniqueNumbers.length > 10) {
    return { ok: false, error: 'É permitido escolher entre 6 e 10 números.' };
  }

  const duplicate = existingEntries.find(
    (entry) => entry.cpf === clean && entry.name.toLowerCase() === trimmedName.toLowerCase(),
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
  const existingEntries = await fetchEntries();
  const validation = validateSubmission(payload, existingEntries);
  if (!validation.ok) {
    return validation;
  }

  const entry = {
    ...validation.value,
    timestamp: new Date().toISOString(),
  };

  await appendEntry(entry);
  return { ok: true, value: entry };
}

async function getStats() {
  const entries = await fetchEntries();
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






