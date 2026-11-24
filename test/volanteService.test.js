process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateSubmission } = require('../lib/volanteService');

const validPayload = {
  name: 'Pessoa de Teste',
  cpf: '11144477735',
  numbers: [1, 2, 3, 4, 5, 6],
};

test('aceita um volante válido e normaliza nome e CPF', () => {
  const result = validateSubmission({
    ...validPayload,
    name: '  Pessoa de Teste  ',
    cpf: '111.444.777-35',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    name: 'Pessoa de Teste',
    cpf: '11144477735',
    numbers: [1, 2, 3, 4, 5, 6],
  });
});

test('rejeita tipos inválidos e nome fora do limite', () => {
  assert.equal(validateSubmission(null).ok, false);
  assert.equal(validateSubmission({ ...validPayload, name: 123 }).ok, false);
  assert.equal(validateSubmission({ ...validPayload, name: 'A'.repeat(121) }).ok, false);
});

test('rejeita quantidades, números e duplicatas inválidas', () => {
  assert.equal(validateSubmission({ ...validPayload, numbers: [1, 2, 3, 4, 5] }).ok, false);
  assert.equal(validateSubmission({ ...validPayload, numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }).ok, false);
  assert.equal(validateSubmission({ ...validPayload, numbers: [1, 2, 3, 4, 5, 61] }).ok, false);
  assert.equal(validateSubmission({ ...validPayload, numbers: [1, 2, 3, 4, 5, 5] }).ok, false);
});

test('rejeita CPF inválido e cadastro duplicado', () => {
  assert.equal(validateSubmission({ ...validPayload, cpf: '11111111111' }).ok, false);
  assert.equal(validateSubmission(validPayload, [{
    name: 'pessoa de teste',
    cpf: '11144477735',
  }]).ok, false);
});
