// Sample API queries for MyCredibro B2B application
// These examples show how to interact with the Supabase database

import { supabase } from '@/lib/supabase'

// Authentication Examples
export const authExamples = {
  // Sign up a new user
  signUp: async (email: string, password: string, name: string, mobileNo: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          mobile_no: mobileNo,
        },
      },
    })
    return { data, error }
  },

  // Sign in user
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }
}

// Profile Management
export const profileQueries = {
  // Get user profile
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  // Update user profile
  updateProfile: async (userId: string, updates: { name?: string; mobile_no?: string }) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  },

  // Check if user is admin
  isAdmin: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()
    return { isAdmin: data?.is_admin || false, error }
  }
}

// Referral Management
export const referralQueries = {
  // Get user's referrals (masked mobile numbers for non-admins)
  getUserReferrals: async (userId: string) => {
    const { data, error } = await supabase
      .from('referrals_masked')
      .select('*')
      .eq('referrer_user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Get all referrals (admin only)
  getAllReferrals: async () => {
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referrer:profiles!referrer_user_id(name, mobile_no),
        processor:profiles!processed_by(name)
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Submit new referral from public form
  submitReferral: async (referralData: {
    referrer_user_id: string
    name: string
    mobile_no: string
    residency_pincode: string
    employment_type: 'salaried' | 'self-employed'
    employer_name?: string
    monthly_net_income: number
  }) => {
    const { data, error } = await supabase
      .from('referrals')
      .insert({
        ...referralData,
        terms_accepted_at: new Date().toISOString(),
        status: 'InProgress'
      })
      .select()
      .single()
    return { data, error }
  },

  // Update referral status (admin only)
  updateReferralStatus: async (
    referralId: string, 
    status: 'InProgress' | 'Approved' | 'Decline',
    adminId: string
  ) => {
    const { data, error } = await supabase
      .from('referrals')
      .update({
        status,
        processed_by: adminId,
        processed_at: new Date().toISOString()
      })
      .eq('id', referralId)
      .select()
      .single()
    return { data, error }
  },

  // Get referral statistics
  getReferralStats: async (userId: string) => {
    const { data, error } = await supabase
      .from('referrals')
      .select('status')
      .eq('referrer_user_id', userId)

    if (error) return { stats: null, error }

    const stats = {
      total: data.length,
      inProgress: data.filter(r => r.status === 'InProgress').length,
      approved: data.filter(r => r.status === 'Approved').length,
      declined: data.filter(r => r.status === 'Decline').length
    }

    return { stats, error: null }
  },

  // Validate referrer exists
  validateReferrer: async (referrerId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', referrerId)
      .single()
    return { data, error }
  }
}

// Admin Queries
export const adminQueries = {
  // Get all users with referral counts
  getUsersWithStats: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        mobile_no,
        is_admin,
        created_at,
        referrals:referrals(count)
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Promote user to admin
  promoteToAdmin: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  },

  // Get referrals pending review
  getPendingReferrals: async () => {
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referrer:profiles!referrer_user_id(name, mobile_no)
      `)
      .eq('status', 'InProgress')
      .order('created_at', { ascending: true })
    return { data, error }
  }
}

// Utility Functions
export const utilityQueries = {
  // Test database connection
  testConnection: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    return { connected: !error, error }
  },

  // Get mobile masking test
  testMobileMasking: async () => {
    const { data, error } = await supabase
      .rpc('mask_mobile', { mobile_no: '9876543210' })
    return { data, error }
  }
}

// Usage Examples:

/*
// Example: User signup and profile creation
const handleSignup = async () => {
  const { data, error } = await authExamples.signUp(
    'user@example.com',
    'password123',
    'John Doe',
    '9876543210'
  )
  
  if (error) {
    console.error('Signup failed:', error.message)
  } else {
    // User created successfully
  }
}

// Example: Submit referral
const handleReferralSubmit = async (refCode: string, formData: any) => {
  const { data, error } = await referralQueries.submitReferral({
    referrer_user_id: refCode,
    name: formData.name,
    mobile_no: formData.mobileNo,
    residency_pincode: formData.residencyPincode,
    employment_type: formData.employmentType,
    employer_name: formData.employerName,
    monthly_net_income: parseFloat(formData.monthlyNetIncome)
  })
  
  if (error) {
    console.error('Referral submission failed:', error.message)
  } else {
    // Referral submitted successfully
  }
}

// Example: Admin updates referral status
const handleStatusUpdate = async (referralId: string, newStatus: string, adminId: string) => {
  const { data, error } = await referralQueries.updateReferralStatus(
    referralId,
    newStatus as 'Approved' | 'Decline',
    adminId
  )
  
  if (error) {
    console.error('Status update failed:', error.message)
  } else {
    // Status updated successfully
  }
}

// Example: Get user's referral statistics
const loadDashboardData = async (userId: string) => {
  const [
    { data: profile, error: profileError },
    { data: referrals, error: referralsError },
    { stats, error: statsError }
  ] = await Promise.all([
    profileQueries.getUserProfile(userId),
    referralQueries.getUserReferrals(userId),
    referralQueries.getReferralStats(userId)
  ])
  
  if (profileError || referralsError || statsError) {
    console.error('Error loading dashboard data')
  } else {
    // Dashboard data loaded successfully
  }
}
*/
