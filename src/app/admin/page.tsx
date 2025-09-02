'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Users, Clock, CheckCircle, XCircle, Eye, EyeOff, LogOut } from 'lucide-react'
import { maskMobileNumber } from '@/lib/maskingUtils'
import { Logo } from '@/components/Logo'
import './admin.css'

interface Referral {
  id: string
  referrer_user_id: string
  name: string
  mobile_no: string
  residency_pincode: string
  employment_type: 'salaried' | 'self-employed'
  employer_name: string | null
  monthly_net_income: number
  referral_digit: string | null
  terms_accepted_at: string
  status: 'InProgress' | 'Approved' | 'Decline'
  processed_by: string | null
  processed_at: string | null
  created_at: string
  referrer_name?: string
  referrer_mobile?: string
  referrer_rm_name?: string
  referrer_digit?: string
}

interface ReferralStats {
  total: number
  inProgress: number
  approved: number
  declined: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isAdmin, setIsAdmin] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState<ReferralStats>({
    total: 0,
    inProgress: 0,
    approved: 0,
    declined: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showSensitiveData, setShowSensitiveData] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  // Check authentication and admin status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/admin/login')
          return
        }

        // Check if user is admin
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single()

        if (profileError || !profileData?.is_admin) {
          console.error('Admin verification failed:', profileError)
          router.push('/admin/login')
          return
        }

        setUser(session.user)
        setIsAdmin(true)
        setAuthLoading(false)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/admin/login')
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/admin/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    if (isAdmin && !authLoading) {
      fetchAllReferrals()
    }
  }, [isAdmin, authLoading])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const fetchAllReferrals = async () => {
    setLoading(true)
    setError('')

    try {
      // Fetch referrals with referrer information using explicit join
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          *,
          referrer:profiles!referrer_user_id(name, mobile_no, rm_name, referral_digit)
        `)
        .order('created_at', { ascending: false })

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError)
        setError('Failed to load referrals: ' + referralsError.message)
        return
      }

      // Transform data to include referrer information
      const transformedData = referralsData?.map(referral => ({
        ...referral,
        referrer_name: referral.referrer?.name || 'Unknown',
        referrer_mobile: referral.referrer?.mobile_no || 'N/A',
        referrer_rm_name: referral.referrer?.rm_name || 'N/A',
        referrer_digit: referral.referrer?.referral_digit || 'N/A'
      })) || []

      setReferrals(transformedData)

      // Calculate stats
      const totalReferrals = transformedData.length
      const inProgressCount = transformedData.filter(r => r.status === 'InProgress').length
      const approvedCount = transformedData.filter(r => r.status === 'Approved').length
      const declinedCount = transformedData.filter(r => r.status === 'Decline').length

      setStats({
        total: totalReferrals,
        inProgress: inProgressCount,
        approved: approvedCount,
        declined: declinedCount
      })

    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const updateReferralStatus = async (referralId: string, newStatus: 'InProgress' | 'Approved' | 'Decline') => {
    setUpdatingStatus(referralId)
    
    try {
      // Update the referral status in the database
      const { data, error } = await supabase
        .from('referrals')
        .update({
          status: newStatus,
          processed_at: new Date().toISOString(),
          processed_by: user?.id
        })
        .eq('id', referralId)
        .select()

      if (error) {
        console.error('Error updating status:', error)
        
        // Create a temporary error notification
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50 transition-all duration-300'
        notification.textContent = `Failed to update status: ${error.message}`
        document.body.appendChild(notification)
        
        setTimeout(() => {
          if (document.body.contains(notification)) {
            notification.style.opacity = '0'
            setTimeout(() => {
              if (document.body.contains(notification)) {
                document.body.removeChild(notification)
              }
            }, 300)
          }
        }, 3000)
        return
      }

      // Verify the update was successful
      if (!data || data.length === 0) {
        console.error('No data returned after update')
        
        // Create a temporary error notification
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50 transition-all duration-300'
        notification.textContent = 'Status update failed - no data returned'
        document.body.appendChild(notification)
        
        setTimeout(() => {
          if (document.body.contains(notification)) {
            notification.style.opacity = '0'
            setTimeout(() => {
              if (document.body.contains(notification)) {
                document.body.removeChild(notification)
              }
            }, 300)
          }
        }, 3000)
        return
      }

      // Status updated successfully

      // Update local state and recalculate stats in one operation
      setReferrals(prev => {
        const updatedReferrals = prev.map(referral => 
          referral.id === referralId 
            ? { ...referral, status: newStatus, processed_at: new Date().toISOString(), processed_by: user?.id }
            : referral
        )
        
        // Update stats after state change
        const totalReferrals = updatedReferrals.length
        const inProgressCount = updatedReferrals.filter(r => r.status === 'InProgress').length
        const approvedCount = updatedReferrals.filter(r => r.status === 'Approved').length
        const declinedCount = updatedReferrals.filter(r => r.status === 'Decline').length

        setStats({
          total: totalReferrals,
          inProgress: inProgressCount,
          approved: approvedCount,
          declined: declinedCount
        })

        return updatedReferrals
      })

      // Show success message
      const statusMessages = {
        'InProgress': 'Status changed to In Progress',
        'Approved': 'Referral approved successfully!',
        'Decline': 'Referral declined'
      }
      
      // Create a temporary success notification
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 transition-all duration-300'
      notification.textContent = statusMessages[newStatus]
      document.body.appendChild(notification)
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.style.opacity = '0'
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification)
            }
          }, 300)
        }
      }, 2000)

    } catch (error) {
      console.error('Unexpected error:', error)
      
      // Create a temporary error notification
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50 transition-all duration-300'
      notification.textContent = 'An unexpected error occurred while updating status'
      document.body.appendChild(notification)
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.style.opacity = '0'
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification)
            }
          }, 300)
        }
      }, 3000)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const filteredReferrals = referrals.filter(referral => 
    statusFilter === 'all' || referral.status === statusFilter
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const maskMobile = (mobile: string) => {
    if (!showSensitiveData) {
      return maskMobileNumber(mobile)
    }
    return mobile
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // This component will only render if user is authenticated and admin
  // Otherwise, they'll be redirected to login page

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-2xl w-full mx-4">
          <CardHeader>
            <CardTitle className="text-red-600">Admin Dashboard Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={fetchAllReferrals}>Retry</Button>
              <Button variant="outline" onClick={handleLogout}>Sign Out</Button>
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
            <div className="flex items-center space-x-6">
              <Logo size="lg" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Manage all referrals and track performance</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-sm text-gray-600">
                Logged in as: {user?.email}
              </div>
              <Button
                variant="outline"
                onClick={() => setShowSensitiveData(!showSensitiveData)}
                className="flex items-center space-x-2"
              >
                {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="hidden sm:inline">{showSensitiveData ? 'Hide' : 'Show'} Full Data</span>
                <span className="sm:hidden">{showSensitiveData ? 'Hide' : 'Show'}</span>
              </Button>
              <Button onClick={fetchAllReferrals} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Progress</CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Declined</CardTitle>
              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.declined}</div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-First Referrals Display */}
        <Card className="overflow-visible">
          <CardHeader>
            <div className="flex flex-col space-y-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">All Referrals</CardTitle>
                <CardDescription className="text-sm">
                  Complete list of all referral submissions with editable status
                </CardDescription>
              </div>
              
              {/* Mobile-friendly controls */}
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <label className="text-sm font-medium whitespace-nowrap">
                    Filter by status:
                  </label>
                  <div className="relative z-10 w-full sm:w-40">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent 
                        className="z-[60] bg-white border shadow-lg max-h-60 overflow-auto"
                        position="popper"
                        sideOffset={4}
                      >
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="InProgress">In Progress</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Decline">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSensitiveData(!showSensitiveData)}
                    className="text-xs sm:text-sm"
                  >
                    {showSensitiveData ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />}
                    <span className="hidden sm:inline">{showSensitiveData ? 'Hide' : 'Show'} Data</span>
                    <span className="sm:hidden">{showSensitiveData ? 'Hide' : 'Show'}</span>
                  </Button>
                  <Button size="sm" onClick={fetchAllReferrals} disabled={loading} className="text-xs sm:text-sm">
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="overflow-visible p-0 sm:p-6">
            {/* Mobile Card View */}
            <div className="block sm:hidden">
              {filteredReferrals.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No referrals found
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  {filteredReferrals.map((referral) => (
                    <Card key={referral.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-sm">{referral.name}</h3>
                            <p className="text-xs text-gray-500">{maskMobile(referral.mobile_no)}</p>
                          </div>
                          <div className="relative z-20">
                            <Select
                              value={referral.status}
                              onValueChange={(newStatus: 'InProgress' | 'Approved' | 'Decline') => 
                                updateReferralStatus(referral.id, newStatus)
                              }
                              disabled={updatingStatus === referral.id}
                            >
                              <SelectTrigger className="w-24 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent 
                                className="z-[80] bg-white border shadow-lg"
                                position="popper"
                                sideOffset={4}
                              >
                                <SelectItem value="InProgress">Progress</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Decline">Declined</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="font-medium">Pincode:</span>
                            <p>{referral.residency_pincode}</p>
                          </div>
                          <div>
                            <span className="font-medium">Employment:</span>
                            <p className="capitalize">{referral.employment_type}</p>
                          </div>
                          <div>
                            <span className="font-medium">Income:</span>
                            <p>{formatCurrency(referral.monthly_net_income)}</p>
                          </div>
                          <div>
                            <span className="font-medium">Date:</span>
                            <p>{formatDate(referral.created_at)}</p>
                          </div>
                        </div>
                        
                        <div className="border-t pt-2">
                          <div className="text-xs">
                            <span className="font-medium">Referrer:</span>
                            <p>{referral.referrer_name}</p>
                            <p className="text-gray-500">{maskMobile(referral.referrer_mobile || '')}</p>
                            <span className="font-medium">RM:</span> {referral.referrer_rm_name}
                          </div>
                        </div>
                        
                        {referral.employer_name && (
                          <div className="text-xs">
                            <span className="font-medium">Employer:</span> {referral.employer_name}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Customer</TableHead>
                    <TableHead className="text-xs sm:text-sm">Mobile</TableHead>
                    <TableHead className="text-xs sm:text-sm">Pincode</TableHead>
                    <TableHead className="text-xs sm:text-sm">Employment</TableHead>
                    <TableHead className="text-xs sm:text-sm">Employer</TableHead>
                    <TableHead className="text-xs sm:text-sm">Income</TableHead>
                    <TableHead className="text-xs sm:text-sm">Referrer</TableHead>
                    <TableHead className="text-xs sm:text-sm">Ref. Digit</TableHead>
                    <TableHead className="text-xs sm:text-sm">Entered Digit</TableHead>
                    <TableHead className="text-xs sm:text-sm">RM Name</TableHead>
                    <TableHead className="text-xs sm:text-sm">Status</TableHead>
                    <TableHead className="text-xs sm:text-sm">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center text-muted-foreground">
                        No referrals found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReferrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">{referral.name}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{maskMobile(referral.mobile_no)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{referral.residency_pincode}</TableCell>
                        <TableCell className="text-xs sm:text-sm capitalize">{referral.employment_type}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{referral.employer_name || '-'}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{formatCurrency(referral.monthly_net_income)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="space-y-1">
                            <div className="font-medium">{referral.referrer_name}</div>
                            <div className="text-gray-500">{maskMobile(referral.referrer_mobile || '')}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <Badge variant="outline" className="font-mono">
                            {referral.referrer_digit}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {referral.referral_digit ? (
                            <Badge variant="secondary" className="font-mono">
                              {referral.referral_digit}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{referral.referrer_rm_name}</TableCell>
                        <TableCell>
                          <div className="relative z-10">
                            <Select
                              value={referral.status}
                              onValueChange={(newStatus: 'InProgress' | 'Approved' | 'Decline') => 
                                updateReferralStatus(referral.id, newStatus)
                              }
                              disabled={updatingStatus === referral.id}
                            >
                              <SelectTrigger className="w-28 sm:w-32 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent 
                                className="z-[70] bg-white border shadow-lg"
                                position="popper"
                                sideOffset={4}
                              >
                                <SelectItem value="InProgress">In Progress</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Decline">Declined</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{formatDate(referral.created_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {filteredReferrals.length > 0 && (
              <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                <div>
                  Showing {filteredReferrals.length} of {referrals.length} referrals
                </div>
                <div>
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
