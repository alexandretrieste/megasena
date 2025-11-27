const { google } = require('googleapis');

const REQUIRED_HEADERS = ['name', 'cpf', 'numbers', 'timestamp'];

function sanitizePrivateKey(rawKey = '') {
  // Vercel/Windows keep private keys with literal '\n'
  let key = rawKey.replace(/\\n/g, '\n');
  // Remove any extra whitespace
  key = key.trim();
  // Ensure proper format
  if (!key.includes('BEGIN PRIVATE KEY') && !key.includes('BEGIN RSA PRIVATE KEY')) {
    throw new Error('Chave privada em formato inválido');
  }
  return key;
}

async function getAuth() {
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

  const auth = new google.auth.JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: sanitizePrivateKey(GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return auth;
}

async function getSheetsClient() {
  const auth = await getAuth();
  return google.sheets({ version: 'v4', auth });
}

async function ensureHeaders() {
  const sheets = await getSheetsClient();
  const {
    GOOGLE_SHEETS_ID,
  } = process.env;

  const sheetId = GOOGLE_SHEETS_ID;

  // Get sheet metadata
  const sheetMetadata = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
  });

  const firstSheet = sheetMetadata.data.sheets?.[0];
  if (!firstSheet) {
    // Create first sheet if it doesn't exist
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: 'Volantes',
              },
            },
          },
        ],
      },
    });
  }

  // Check if headers exist
  const range = 'Volantes!A1:D1';
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });

  const existingHeaders = response.data.values?.[0] || [];
  if (existingHeaders.length === 0 || existingHeaders.join(',') !== REQUIRED_HEADERS.join(',')) {
    // Set headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [REQUIRED_HEADERS],
      },
    });
  }
}

async function fetchEntries() {
  const sheets = await getSheetsClient();
  const {
    GOOGLE_SHEETS_ID,
  } = process.env;

  await ensureHeaders();

  const range = 'Volantes!A2:D';
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_SHEETS_ID,
    range,
  });

  const rows = response.data.values || [];
  return rows.map((row) => ({
    name: row[0] || '',
    cpf: row[1] || '',
    numbers: (row[2] || '')
      .split(' ')
      .filter(Boolean)
      .map((value) => Number(value)),
    timestamp: row[3] || '',
  }));
}

async function appendEntry(entry) {
  const sheets = await getSheetsClient();
  const {
    GOOGLE_SHEETS_ID,
  } = process.env;

  await ensureHeaders();

  await sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_SHEETS_ID,
    range: 'Volantes!A:D',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        entry.name,
        entry.cpf,
        entry.numbers.join(' '),
        entry.timestamp,
      ]],
    },
  });
}

module.exports = {
  fetchEntries,
  appendEntry,
};
