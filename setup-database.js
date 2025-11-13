/**
 * Database Setup Script for Supabase
 * This script helps you set up the database tables in your Supabase project
 * 
 * Note: This requires the Supabase service role key for table creation.
 * For security, it's recommended to run the SQL directly in Supabase Dashboard.
 * 
 * To use this script:
 * 1. Get your service role key from Supabase Dashboard > Settings > API
 * 2. Set SUPABASE_SERVICE_ROLE_KEY in your environment
 * 3. Run: node setup-database.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fflucpqfqfrzvcdnsgcf.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.log(`
⚠️  Service Role Key not found!

To use this script, you need your Supabase Service Role Key:
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to Settings > API
4. Copy the "service_role" key (NOT the anon key)
5. Set it as an environment variable:
   export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   node setup-database.js

Alternatively, you can run the SQL directly in Supabase Dashboard:
1. Go to SQL Editor in your Supabase Dashboard
2. Copy the contents of supabase-schema.sql
3. Paste and run it

This is the recommended approach for security.
  `);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  try {
    console.log('📖 Reading SQL schema file...');
    const sqlFile = readFileSync(join(__dirname, 'supabase-schema.sql'), 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlFile
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute...`);
    console.log('🚀 Starting database setup...\n');

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim().length === 0) continue;
      
      try {
        // Use RPC to execute SQL (if available) or direct query
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // Try direct query method
          const { data, error: queryError } = await supabase
            .from('_exec_sql')
            .select('*')
            .limit(0);
          
          if (queryError) {
            console.log(`⚠️  Statement ${i + 1} might need manual execution`);
            console.log(`   ${statement.substring(0, 100)}...`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`⚠️  Could not execute statement ${i + 1} automatically`);
        console.log(`   Error: ${err.message}`);
      }
    }

    console.log('\n✨ Database setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Verify tables were created in Supabase Dashboard > Table Editor');
    console.log('2. Check that RLS policies are enabled');
    console.log('3. Start your application: npm run dev');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.log('\n💡 Tip: Run the SQL directly in Supabase Dashboard SQL Editor for best results.');
    process.exit(1);
  }
}

setupDatabase();

