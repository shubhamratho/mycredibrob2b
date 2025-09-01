'use client'

import { useState } from 'react'
import AdminDashboard from './page'
import AdminLogin from '@/components/AdminLogin'

// Set this to true if you want password protection for admin page
const REQUIRE_ADMIN_LOGIN = false

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(!REQUIRE_ADMIN_LOGIN)

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />
  }

  return <AdminDashboard />
}
