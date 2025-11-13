import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please check your .env file contains:');
  console.error('  VITE_SUPABASE_URL=...');
  console.error('  VITE_SUPABASE_ANON_KEY=...');
  console.error('');
  console.error('⚠️ IMPORTANT: If you just created/modified .env file:');
  console.error('   1. Stop the dev server (Ctrl+C)');
  console.error('   2. Restart it: npm run dev');
  console.error('   3. Vite only loads .env files when server starts!');
  
  // Use placeholder values to prevent app crash, but log warning
  if (import.meta.env.DEV) {
    console.warn('⚠️ Using placeholder values. App may not work correctly.');
    console.warn('⚠️ RESTART YOUR DEV SERVER to load .env file!');
  }
}

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Log connection status in development
if (import.meta.env.DEV) {
  console.log('🔌 Supabase client initialized:', {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
    hasKey: !!supabaseAnonKey,
  });
}

