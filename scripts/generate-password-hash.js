#!/usr/bin/env node

/**
 * Script para gerar hash SHA-256 de uma senha
 * Uso: node scripts/generate-password-hash.js "sua_senha_aqui"
 */

const crypto = require('crypto');

function generatePasswordHash(password) {
  if (!password) {
    console.error('❌ Erro: Forneça uma senha como argumento');
    console.log('Uso: node scripts/generate-password-hash.js "sua_senha_aqui"');
    process.exit(1);
  }

  if (password.length < 12) {
    console.error('❌ Erro: A senha deve ter no mínimo 12 caracteres');
    process.exit(1);
  }

  const hash = crypto.createHash('sha256').update(password).digest('hex');
  
  console.log('\n✅ Hash gerado com sucesso!\n');
  console.log('ADMIN_PASSWORD_HASH=' + hash);
  console.log('\nAdicione esta linha ao seu arquivo .env\n');
}

const password = process.argv[2];
generatePasswordHash(password);
