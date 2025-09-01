// Database connection test utility
import { supabase } from './supabase'

export const testDatabaseConnection = async () => {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      
    if (error) {
      if (error.message?.includes('relation "public.profiles" does not exist')) {
        return {
          success: false,
          message: 'Database tables not found. Please run the SQL migration.',
          needsMigration: true
        }
      }
      return {
        success: false,
        message: `Database error: ${error.message}`,
        needsMigration: false
      }
    }
    
    return {
      success: true,
      message: 'Database connection successful',
      needsMigration: false
    }
  } catch (err) {
    return {
      success: false,
      message: `Connection failed: ${(err as Error).message}`,
      needsMigration: false
    }
  }
}

export const checkRequiredTables = async () => {
  const tables = ['profiles', 'referrals']
  const results = []
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
        
      results.push({
        table,
        exists: !error,
        error: error?.message
      })
    } catch (err) {
      results.push({
        table,
        exists: false,
        error: (err as Error).message
      })
    }
  }
  
  return results
}
