/**
 * Database Utility Functions for Debugging and Error Handling
 */

import { supabase } from './supabase';

/**
 * Test database connection
 */
export async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test 1: Check Supabase client
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    console.log('✅ Supabase client initialized');

    // Test 2: Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.warn('⚠️ Session error:', sessionError.message);
    } else {
      console.log('✅ Auth session check passed');
    }

    // Test 3: Try a simple query (check if tables exist)
    const { data: tables, error: tablesError } = await supabase
      .from('students')
      .select('id')
      .limit(1);

    if (tablesError) {
      console.error('❌ Database query failed:', tablesError);
      return {
        success: false,
        error: tablesError,
        message: getErrorMessage(tablesError),
      };
    }

    console.log('✅ Database connection successful');
    return {
      success: true,
      message: 'Database connection working',
    };
  } catch (error: any) {
    console.error('❌ Database connection test failed:', error);
    return {
      success: false,
      error,
      message: error.message || 'Unknown error',
    };
  }
}

/**
 * Get user-friendly error message from Supabase error
 */
export function getErrorMessage(error: any): string {
  if (!error) return 'Unknown error';

  // Supabase error structure
  if (error.message) {
    return error.message;
  }

  // RLS policy errors
  if (error.code === 'PGRST301' || error.code === '42501') {
    return 'Permission denied. Check Row Level Security (RLS) policies in Supabase.';
  }

  // Table not found
  if (error.code === '42P01' || error.message?.includes('does not exist')) {
    return 'Table not found. Make sure you ran the SQL schema in Supabase Dashboard.';
  }

  // Connection errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return 'Network error. Check your internet connection and Supabase URL.';
  }

  // Authentication errors
  if (error.message?.includes('JWT') || error.message?.includes('token')) {
    return 'Authentication error. Check your Supabase API key.';
  }

  return error.message || 'Database error occurred';
}

/**
 * Enhanced error handler for database operations
 */
export function handleDatabaseError(error: any, operation: string) {
  const message = getErrorMessage(error);
  console.error(`❌ Database ${operation} failed:`, {
    error,
    message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
  });

  return {
    error: true,
    message,
    originalError: error,
  };
}

/**
 * Check if user is authenticated
 */
export async function checkAuthentication() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.warn('⚠️ Auth check error:', error.message);
      return { authenticated: false, user: null, error };
    }

    return { authenticated: !!user, user, error: null };
  } catch (error: any) {
    console.error('❌ Auth check failed:', error);
    return { authenticated: false, user: null, error };
  }
}

/**
 * Verify table exists and is accessible
 */
export async function verifyTable(tableName: string) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .limit(0);

    if (error) {
      return {
        exists: false,
        accessible: false,
        error: getErrorMessage(error),
        rowCount: 0,
      };
    }

    // Get actual row count
    const { count: rowCount } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    // Get sample data (first 3 rows)
    const { data: sampleData } = await supabase
      .from(tableName)
      .select('*')
      .limit(3);

    return {
      exists: true,
      accessible: true,
      error: null,
      rowCount: rowCount || 0,
      sampleData: sampleData || [],
    };
  } catch (error: any) {
    return {
      exists: false,
      accessible: false,
      error: error.message || 'Unknown error',
      rowCount: 0,
      sampleData: [],
    };
  }
}

