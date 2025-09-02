import { supabase } from '@/lib/supabase'

/**
 * Generate a unique 3-digit referral code (100-999)
 * Checks database to ensure uniqueness
 */
export async function generateUniqueReferralDigit(): Promise<string> {
  const maxAttempts = 10 // Prevent infinite loops
  let attempts = 0
  
  while (attempts < maxAttempts) {
    // Generate random 3-digit number between 100-999
    const digit = Math.floor(Math.random() * 900 + 100).toString()
    
    try {
      // Check if this digit already exists using the public view
      const { data: existingValidation, error: validationError } = await supabase
        .from('referral_validation')
        .select('referral_digit')
        .eq('referral_digit', digit)
        .single()
      
      // Check if this digit already exists in referrals table (optional safety check)
      const { data: existingReferral, error: referralError } = await supabase
        .from('referrals')
        .select('referral_digit')
        .eq('referral_digit', digit)
        .single()
      
      // If digit doesn't exist in either table, it's unique
      if (!existingValidation && !existingReferral) {
        return digit
      }
      
      attempts++
    } catch (error) {
      console.error('Error checking referral digit uniqueness:', error)
      attempts++
    }
  }
  
  // Fallback: if we can't find a unique digit after maxAttempts, 
  // generate timestamp-based digit
  const timestamp = Date.now().toString()
  const fallbackDigit = timestamp.slice(-3)
  
  // Ensure it's at least 100
  const finalDigit = parseInt(fallbackDigit) < 100 
    ? (parseInt(fallbackDigit) + 100).toString().slice(-3)
    : fallbackDigit
    
  return finalDigit
}

/**
 * Check if a referral digit exists in the database
 */
export async function checkReferralDigitExists(digit: string): Promise<boolean> {
  try {
    const { data: validation } = await supabase
      .from('referral_validation')
      .select('referral_digit')
      .eq('referral_digit', digit)
      .single()
    
    return !!validation
  } catch {
    return false
  }
}

/**
 * Assign referral digit to a user profile
 */
export async function assignReferralDigit(userId: string, digit: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ referral_digit: digit })
      .eq('id', userId)
    
    return !error
  } catch (error) {
    console.error('Error assigning referral digit:', error)
    return false
  }
}

/**
 * Get all used referral digits (for debugging)
 */
export async function getUsedReferralDigits(): Promise<string[]> {
  try {
    const { data: validations } = await supabase
      .from('referral_validation')
      .select('referral_digit')
      .not('referral_digit', 'is', null)
    
    const { data: referrals } = await supabase
      .from('referrals')
      .select('referral_digit')
      .not('referral_digit', 'is', null)
    
    const usedDigits = [
      ...(validations?.map(v => v.referral_digit) || []),
      ...(referrals?.map(r => r.referral_digit) || [])
    ].filter(Boolean)
    
    return [...new Set(usedDigits)] // Remove duplicates
  } catch (error) {
    console.error('Error fetching used referral digits:', error)
    return []
  }
}

/**
 * Get referrer information by referral digit (for form validation)
 */
export async function getReferrerByDigit(digit: string): Promise<{id: string, name: string} | null> {
  try {
    const { data: referrer, error } = await supabase
      .from('referral_validation')
      .select('id, name')
      .eq('referral_digit', digit)
      .single()
    
    if (error || !referrer) {
      return null
    }
    
    return referrer
  } catch (error) {
    console.error('Error fetching referrer by digit:', error)
    return null
  }
}
