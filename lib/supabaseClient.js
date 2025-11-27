const { createClient } = require('@supabase/supabase-js');

// Supabase funciona em Docker e Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios no .env');
}

if (!supabaseUrl.startsWith('http')) {
  throw new Error('SUPABASE_URL deve ser uma URL HTTP/HTTPS válida');
}

console.log(`🔌 Conectando ao Supabase: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = supabase;
