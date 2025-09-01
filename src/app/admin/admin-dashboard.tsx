'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Users, Clock, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'

interface Referral {
  id: string
  referrer_user_id: string
  name: string
  mobile_no: string
  residency_pincode: string
  employment_type: 'salaried' | 'self-employed'
  employer_name: string | null
  monthly_net_income: number
  terms_accepted_at: string
  status: 'InProgress' | 'Approved' | 'Decline'
  processed_by: string | null
  processed_at: string | null
  created_at: string
  referrer_name?: string
  referrer_mobile?: string
  referrer_rm_name?: string
}

interface ReferralStats {
  total: number
  inProgress: number
  approved: number
  declined: number
}

export default function AdminDashboardContent() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState<ReferralStats>({
    total: 0,
    inProgress: 0,
    approved: 0,
    declined: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showSensitiveData, setShowSensitiveData] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchAllReferrals()
  }, [])

  const fetchAllReferrals = async () => {
    setLoading(true)
    setError('')

    try {
      // Fetch referrals with referrer information
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          *,
          referrer:profiles(name, mobile_no, rm_name)
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
        referrer_rm_name: referral.referrer?.rm_name || 'N/A'
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
      const { error } = await supabase
        .from('referrals')
        .update({
          status: newStatus,
          processed_at: new Date().toISOString()
        })
        .eq('id', referralId)

      if (error) {
        console.error('Error updating status:', error)
        alert('Failed to update status: ' + error.message)
        return
      }

      // Update local state
      setReferrals(prev => prev.map(referral => 
        referral.id === referralId 
          ? { ...referral, status: newStatus, processed_at: new Date().toISOString() }
          : referral
      ))

      // Recalculate stats
      const updatedReferrals = referrals.map(referral => 
        referral.id === referralId 
          ? { ...referral, status: newStatus }
          : referral
      )
      
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

    } catch (err) {
      console.error('Error updating status:', err)
      alert('Failed to update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const filteredReferrals = referrals.filter(referral => 
    statusFilter === 'all' || referral.status === statusFilter
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'Decline':
        return <Badge className="bg-red-100 text-red-800">Declined</Badge>
      case 'InProgress':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
    }
  }

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
    if (!showSensitiveData && mobile.length >= 6) {
      return mobile.substring(0, 2) + 'xxxxx' + mobile.substring(mobile.length - 2)
    }
    return mobile
  }

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
            <Button onClick={fetchAllReferrals}>Retry</Button>
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
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage all referrals and track performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowSensitiveData(!showSensitiveData)}
                className="flex items-center space-x-2"
              >
                {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{showSensitiveData ? 'Hide' : 'Show'} Full Data</span>
              </Button>
              <Button onClick={fetchAllReferrals} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
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

        {/* Referrals Table */}
        <Card className="overflow-visible">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>All Referrals</CardTitle>
                <CardDescription>
                  Complete list of all referral submissions with editable status
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2 relative z-10">
                <label className="text-sm font-medium whitespace-nowrap">
                  Filter by status:
                </label>
                <div className="relative z-10">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
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
            </div>
          </CardHeader>
          <CardContent className="overflow-visible">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Pincode</TableHead>
                    <TableHead>Employment</TableHead>
                    <TableHead>Employer</TableHead>
                    <TableHead>Income</TableHead>
                    <TableHead>Referrer</TableHead>
                    <TableHead>RM Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground">
                        No referrals found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReferrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell className="font-medium">{referral.name}</TableCell>
                        <TableCell>{maskMobile(referral.mobile_no)}</TableCell>
                        <TableCell>{referral.residency_pincode}</TableCell>
                        <TableCell className="capitalize">{referral.employment_type}</TableCell>
                        <TableCell>{referral.employer_name || '-'}</TableCell>
                        <TableCell>{formatCurrency(referral.monthly_net_income)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{referral.referrer_name}</div>
                            <div className="text-xs text-gray-500">{maskMobile(referral.referrer_mobile || '')}</div>
                          </div>
                        </TableCell>
                        <TableCell>{referral.referrer_rm_name}</TableCell>
                        <TableCell>
                          <div className="relative z-10">
                            <Select
                              value={referral.status}
                              onValueChange={(newStatus: 'InProgress' | 'Approved' | 'Decline') => 
                                updateReferralStatus(referral.id, newStatus)
                              }
                              disabled={updatingStatus === referral.id}
                            >
                              <SelectTrigger className="w-32">
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
                        <TableCell>{formatDate(referral.created_at)}</TableCell>
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
