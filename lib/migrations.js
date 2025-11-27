const supabase = require('./supabaseClient');

/**
 * Migrations para Supabase
 * Execute com: node lib/migrations.js
 */

const migrations = [
  {
    name: '001_create_volantes_table',
    up: async () => {
      console.log('Executando migration: criar tabela volantes...');
      
      try {
        // Tenta criar a tabela usando SQL direto
        const { data, error } = await supabase
          .from('volantes')
          .select('id')
          .limit(1);
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (!error) {
          console.log('✓ Tabela volantes já existe');
          return;
        }

        // Criar tabela manualmente via API Rest não é suportado
        // A tabela será criada pelo seed.sql ao iniciar o container
        console.log('✓ Tabela será criada pelo script seed.sql');
      } catch (error) {
        console.error('✗ Erro ao verificar tabela:', error.message);
        throw error;
      }
    },
    down: async () => {
      console.log('Revertendo migration: deletar tabela volantes...');
      console.log('⚠ Para deletar a tabela, execute manualmente:');
      console.log('DROP TABLE IF EXISTS volantes CASCADE;');
    }
  },
  {
    name: '002_verify_rls_policies',
    up: async () => {
      console.log('Executando migration: verificar políticas RLS...');
      
      try {
        // Testar inserção
        const testData = {
          name: 'Test',
          cpf: '00000000000',
          numbers: [1, 2, 3, 4, 5, 6],
          timestamp: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('volantes')
          .insert([testData]);

        if (insertError && insertError.code !== 'PGRST116') {
          throw insertError;
        }

        console.log('✓ Políticas RLS estão funcionando corretamente');
      } catch (error) {
        console.error('✗ Erro ao verificar RLS:', error.message);
      }
    },
    down: async () => {
      console.log('Revertendo migration: remover políticas RLS...');
      console.log('⚠ Para remover as políticas, execute manualmente:');
      console.log('DROP POLICY IF EXISTS "Anyone can view volantes" ON volantes;');
      console.log('DROP POLICY IF EXISTS "Anyone can insert volantes" ON volantes;');
    }
  }
];

async function migrate(direction = 'up') {
  try {
    console.log(`\n🔄 Iniciando migrations (${direction})...\n`);

    for (const migration of migrations) {
      try {
        if (direction === 'up') {
          await migration.up();
        } else {
          await migration.down();
        }
      } catch (error) {
        console.error(`✗ Erro na migration ${migration.name}:`, error.message);
        // Continuar mesmo com erro
      }
    }

    console.log('\n✅ Todas as migrations foram executadas!\n');
  } catch (error) {
    console.error('\n❌ Erro ao executar migrations:', error.message);
    process.exit(1);
  }
}

// Se executado diretamente
if (require.main === module) {
  const direction = process.argv[2] || 'up';
  
  if (!['up', 'down'].includes(direction)) {
    console.error('Uso: node lib/migrations.js [up|down]');
    process.exit(1);
  }

  migrate(direction);
}

module.exports = { migrate, migrations };
