'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { maskMobileNumber } from '@/lib/maskingUtils'

interface Referral {
  id: string
  name: string
  mobile_no: string
  status: 'InProgress' | 'Approved' | 'Decline'
  created_at: string
}

interface ReferralsTableProps {
  referrals: Referral[]
  onRefresh: () => void
}

export function ReferralsTable({ referrals, onRefresh }: ReferralsTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2 relative z-10">
          <label htmlFor="status-filter" className="text-sm font-medium whitespace-nowrap">
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
        
        <Button variant="outline" onClick={onRefresh}>
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReferrals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No referrals found
                </TableCell>
              </TableRow>
            ) : (
              filteredReferrals.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell className="font-medium">{referral.name}</TableCell>
                  <TableCell>{maskMobileNumber(referral.mobile_no)}</TableCell>
                  <TableCell>{formatDate(referral.created_at)}</TableCell>
                  <TableCell>{getStatusBadge(referral.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {filteredReferrals.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredReferrals.length} of {referrals.length} referrals
        </div>
      )}
    </div>
  )
}
