'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { generateUniqueReferralDigit } from '@/lib/referralUtils'

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, name: string, mobileNo: string, rmName: string) => Promise<{ data: unknown; error: unknown }>
  signIn: (email: string, password: string) => Promise<{ data: unknown; error: unknown }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name: string, mobileNo: string, rmName: string) => {
    try {
      // First, generate a unique referral digit
      const referralDigit = await generateUniqueReferralDigit()
      
      // Sign up the user with the metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            mobile_no: mobileNo,
            rm_name: rmName,
            referral_digit: referralDigit, // Include in auth metadata
          },
        },
      })

      // If signup succeeded, create the profile with referral digit
      if (data.user && !error) {
        try {
          // Wait a moment for any database triggers to complete
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Check if profile exists (from trigger or manual creation)
          const { data: existingProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (profileError || !existingProfile) {
            // Profile doesn't exist, create it manually
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                name,
                mobile_no: mobileNo,
                rm_name: rmName,
                referral_digit: referralDigit,
                is_admin: false
              })
            
            if (insertError) {
              console.error('Error creating profile:', insertError)
            }
          } else if (!existingProfile.referral_digit) {
            // Profile exists but no referral digit, update it
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ referral_digit: referralDigit })
              .eq('id', data.user.id)
            
            if (updateError) {
              console.error('Error updating profile with referral digit:', updateError)
            }
          }
        } catch (profileErr) {
          console.error('Error handling profile creation:', profileErr)
          // Don't fail the signup for profile issues
        }
      }

      return { data, error }
    } catch (signupError) {
      console.error('Signup error:', signupError)
      return { data: null, error: signupError }
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
