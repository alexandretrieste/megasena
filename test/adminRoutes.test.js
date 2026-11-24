process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';

const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const adminPassword = 'SenhaForte123!';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync(adminPassword, 12);

const sheet = require('../lib/sheet');
sheet.fetchEntries = async () => [
  { id: 'test-id', name: 'Pessoa de Teste', cpf: '11144477735', numbers: [1, 2, 3, 4, 5, 6] },
];

const app = require('../server');
let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('a listagem com CPF exige autenticação administrativa', async () => {
  const response = await fetch(`${baseUrl}/api/volantes/list`);
  assert.equal(response.status, 401);
});

test('frequência histórica usa o snapshot local dos últimos 100 concursos', async () => {
  const response = await fetch(`${baseUrl}/api/lottery-results/frequency`);
  assert.equal(response.status, 200);

  const history = await response.json();
  assert.equal(history.drawCount, 100);
  assert.equal(history.firstContest, history.lastContest - 99);
  assert.ok(history.lastContest >= 3089);
  assert.equal(history.frequencies.length, 60);
  assert.equal(history.frequencies.reduce((sum, item) => sum + item.count, 0), 600);
});

test('login administrativo valida senha e emite token utilizável', async () => {
  const invalidLoginResponse = await fetch(`${baseUrl}/api/admin/verify-password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'OutraSenha123!' }),
  });
  assert.equal(invalidLoginResponse.status, 401);

  const loginResponse = await fetch(`${baseUrl}/api/admin/verify-password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: adminPassword }),
  });

  assert.equal(loginResponse.status, 200);
  const login = await loginResponse.json();
  assert.equal(login.success, true);
  assert.ok(login.token);

  const listResponse = await fetch(`${baseUrl}/api/volantes/list`, {
    headers: { authorization: `Bearer ${login.token}` },
  });
  assert.equal(listResponse.status, 200);
  assert.equal((await listResponse.json())[0].cpf, '11144477735');
});

test('token inválido não acessa a listagem', async () => {
  const response = await fetch(`${baseUrl}/api/volantes/list`, {
    headers: { authorization: 'Bearer invalid-token' },
  });
  assert.equal(response.status, 403);
});

test('token assinado sem claim de administrador não acessa a listagem', async () => {
  const token = jwt.sign(
    { admin: false },
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256',
      issuer: 'megasena-api',
      audience: 'megasena-admin',
    },
  );
  const response = await fetch(`${baseUrl}/api/volantes/list`, {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(response.status, 403);
});
