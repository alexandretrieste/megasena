const { GoogleSpreadsheet } = require('google-spreadsheet');

const REQUIRED_HEADERS = ['name', 'cpf', 'numbers', 'timestamp'];

function sanitizePrivateKey(rawKey = '') {
  // Vercel/Windows keep private keys with literal '\n'
  return rawKey.replace(/\\n/g, '\n');
}

async function getSheet() {
  const {
    GOOGLE_SHEETS_ID,
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  } = process.env;

  if (!GOOGLE_SHEETS_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    throw new Error(
      'Credenciais do Google Sheets não configuradas. Defina GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.',
    );
  }

  const doc = new GoogleSpreadsheet(GOOGLE_SHEETS_ID);
  await doc.useServiceAccountAuth({
    client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: sanitizePrivateKey(GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
  });
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0] || (await doc.addSheet({ title: 'Volantes' }));

  if (!sheet.headerValues || sheet.headerValues.some((header, idx) => header !== REQUIRED_HEADERS[idx])) {
    await sheet.setHeaderRow(REQUIRED_HEADERS);
  }

  return sheet;
}

async function fetchEntries() {
  const sheet = await getSheet();
  const rows = await sheet.getRows();
  return rows.map((row) => ({
    name: row.name,
    cpf: row.cpf,
    numbers: (row.numbers || '')
      .split(' ')
      .filter(Boolean)
      .map((value) => Number(value)),
    timestamp: row.timestamp,
  }));
}

async function appendEntry(entry) {
  const sheet = await getSheet();
  await sheet.addRow({
    name: entry.name,
    cpf: entry.cpf,
    numbers: entry.numbers.join(' '),
    timestamp: entry.timestamp,
  });
}

module.exports = {
  fetchEntries,
  appendEntry,
};

