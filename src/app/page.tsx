'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import { QrCode, Hash, ArrowRight } from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show landing page for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <Logo size="xl" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              B2B Referral Platform
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Streamlined loan referral system with dual tracking methods
            </p>
          </div>

          {/* Application Methods */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            {/* QR/Link Method */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">QR Code / Link</CardTitle>
                <CardDescription className="text-gray-600">
                  Scan QR code or click referral link shared by your referrer
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>How it works:</strong><br />
                    1. Scan QR code or click link<br />
                    2. Auto-fills referrer information<br />
                    3. Complete application form
                  </p>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  If you have a QR code or referral link, use that instead
                </p>
              </CardContent>
            </Card>

            {/* Manual Code Method */}
            <Card className="hover:shadow-lg transition-shadow duration-300 border-2 border-blue-200">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Hash className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">3-Digit Code</CardTitle>
                <CardDescription className="text-gray-600">
                  Have a 3-digit referral code? Apply directly here
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>How it works:</strong><br />
                    1. Enter your 3-digit referral code<br />
                    2. System validates the code<br />
                    3. Complete application form
                  </p>
                </div>
                <Link href="/apply">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Apply with Code
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Login Section */}
          <div className="text-center mt-16">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Loan Advisor Login
              </h3>
              <p className="text-gray-600 mb-6">
                Access your dashboard to manage referrals and track applications.
              </p>
              <div className="space-y-3">
                <Link href="/login">
                  <Button className="w-full" size="lg">
                    Advisor Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="outline" className="w-full" size="lg">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
