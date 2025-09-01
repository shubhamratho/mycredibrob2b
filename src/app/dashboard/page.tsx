'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QRCodeGenerator } from '@/components/QRCodeGenerator'
import { ReferralsTable } from '@/components/ReferralsTable'
import { LogOut, Users, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react'

interface Profile {
  id: string
  name: string
  mobile_no: string
  is_admin: boolean
  created_at: string
}

interface Referral {
  id: string
  name: string
  mobile_no: string
  status: 'InProgress' | 'Approved' | 'Decline'
  created_at: string
}

interface ReferralStats {
  total: number
  inProgress: number
  approved: number
  declined: number
}

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState<ReferralStats>({
    total: 0,
    inProgress: 0,
    approved: 0,
    declined: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const referralLink = user ? `${baseUrl}/r/${user.id}` : ''

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchUserData()
    }
  }, [user, authLoading, router])

  const fetchUserData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')

      // First, check if the profiles table exists by trying to fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        // Check if it's a table not found error
        if (profileError.message?.includes('relation "public.profiles" does not exist') || 
            profileError.message?.includes('table') || 
            profileError.code === 'PGRST116') {
          setError('Database not set up. Please run the SQL migration first. Check the README.md for setup instructions.')
        } else {
          setError('Failed to load profile: ' + profileError.message)
        }
        return
      }

      setProfile(profileData)

      // Fetch referrals using the masked view - only the required fields
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals_masked')
        .select('id, name, mobile_no, status, created_at')
        .eq('referrer_user_id', user.id)
        .order('created_at', { ascending: false })

      if (referralsError) {
        console.error('Referrals fetch error:', referralsError)
        // If referrals_masked view doesn't exist, try the regular table
        if (referralsError.message?.includes('relation "public.referrals_masked" does not exist')) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('referrals')
            .select('id, name, mobile_no, status, created_at')
            .eq('referrer_user_id', user.id)
            .order('created_at', { ascending: false })
          
          if (fallbackError) {
            setError('Database tables not found. Please run the SQL migration first.')
            return
          }
          setReferrals(fallbackData || [])
        } else {
          setError('Failed to load referrals: ' + referralsError.message)
          return
        }
      } else {
        setReferrals(referralsData || [])
      }

      // Calculate stats
      const totalReferrals = referralsData?.length || 0
      const inProgressCount = referralsData?.filter(r => r.status === 'InProgress').length || 0
      const approvedCount = referralsData?.filter(r => r.status === 'Approved').length || 0
      const declinedCount = referralsData?.filter(r => r.status === 'Decline').length || 0

      setStats({
        total: totalReferrals,
        inProgress: inProgressCount,
        approved: approvedCount,
        declined: declinedCount
      })

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('An unexpected error occurred: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-2xl w-full mx-4">
          <CardHeader>
            <CardTitle className="text-red-600">Dashboard Error</CardTitle>
            <CardDescription>
              There was an issue loading your dashboard data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            
            {error.includes('Database not set up') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Setup Instructions:</h4>
                <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                  <li>Open your Supabase project dashboard</li>
                  <li>Go to the SQL Editor</li>
                  <li>Copy and paste the contents of <code className="bg-blue-100 px-1 rounded">supabase-migration.sql</code></li>
                  <li>Run the SQL migration</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button onClick={fetchUserData}>Retry</Button>
              {error.includes('Database not set up') && (
                <Button variant="outline" onClick={() => router.push('/setup')}>
                  Go to Setup Guide
                </Button>
              )}
              <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {profile?.name}!</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Declined</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Referral Link & QR Code */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Your Referral Link</CardTitle>
                <CardDescription>
                  Share this link or QR code to refer new customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QRCodeGenerator referralLink={referralLink} userId={user?.id || ''} />
              </CardContent>
            </Card>
          </div>

          {/* Referrals Table */}
          <div className="lg:col-span-2">
            <Card className="overflow-visible">
              <CardHeader>
                <CardTitle>Your Referrals</CardTitle>
                <CardDescription>
                  Track all referrals submitted using your referral link
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-visible">
                <ReferralsTable 
                  referrals={referrals} 
                  onRefresh={fetchUserData}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
