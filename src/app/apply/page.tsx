'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { getReferrerByDigit } from '@/lib/referralUtils'

interface FormData {
  name: string
  mobileNo: string
  residencyPincode: string
  employmentType: 'salaried' | 'self-employed' | ''
  employerName: string
  monthlyNetIncome: string
  referralDigit: string
  termsAccepted: boolean
}

function ApplicationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralDigitParam = searchParams?.get('ref') // For URL like /apply?ref=123
  
  const [referrerInfo, setReferrerInfo] = useState<{exists: boolean, name: string} | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [digitError, setDigitError] = useState('')
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    mobileNo: '',
    residencyPincode: '',
    employmentType: '',
    employerName: '',
    monthlyNetIncome: '',
    referralDigit: referralDigitParam || '',
    termsAccepted: false
  })

  // Check referral digit when it's entered or changed
  useEffect(() => {
    if (formData.referralDigit && formData.referralDigit.length === 3) {
      checkReferralDigit(formData.referralDigit)
    } else {
      setReferrerInfo(null)
      setDigitError('')
    }
  }, [formData.referralDigit])

  // Check if referral digit exists and get referrer info
  const checkReferralDigit = async (digit: string) => {
    if (!digit || digit.length !== 3) return

    setLoading(true)
    setDigitError('')

    try {
      const referrer = await getReferrerByDigit(digit)
      
      if (!referrer) {
        setReferrerInfo({ exists: false, name: '' })
        setDigitError('Invalid referral code. Please check and try again.')
      } else {
        setReferrerInfo({ exists: true, name: referrer.name })
        setDigitError('')
      }
    } catch (err) {
      console.error('Error checking referral digit:', err)
      setReferrerInfo({ exists: false, name: '' })
      setDigitError('Error validating referral code.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'referralDigit') {
      // Only allow 3 digits
      const digitValue = value.replace(/\D/g, '').slice(0, 3)
      setFormData(prev => ({ ...prev, [name]: digitValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Please enter your full name')
      return false
    }
    
    if (!formData.mobileNo.trim() || formData.mobileNo.length < 10) {
      setError('Please enter a valid mobile number')
      return false
    }
    
    if (!formData.residencyPincode.trim() || formData.residencyPincode.length !== 6) {
      setError('Please enter a valid 6-digit pincode')
      return false
    }
    
    if (!formData.employmentType) {
      setError('Please select your employment type')
      return false
    }
    
    if (!formData.monthlyNetIncome.trim()) {
      setError('Please enter your monthly net income')
      return false
    }

    if (formData.referralDigit && formData.referralDigit.length === 3) {
      if (!referrerInfo?.exists) {
        setError('Please enter a valid referral code or leave it empty')
        return false
      }
    }
    
    if (!formData.termsAccepted) {
      setError('Please accept the terms and conditions')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm()) return

    setSubmitting(true)

    try {
      let referrerUserId = null

      // If referral digit is provided, get the referrer's user ID
      if (formData.referralDigit && referrerInfo?.exists) {
        const referrer = await getReferrerByDigit(formData.referralDigit)
        
        if (referrer) {
          referrerUserId = referrer.id
        }
      }

      if (!referrerUserId) {
        setError('Valid referral code is required to submit the application')
        setSubmitting(false)
        return
      }

      // Submit the referral
      const { error: submitError } = await supabase
        .from('referrals')
        .insert({
          referrer_user_id: referrerUserId,
          name: formData.name.trim(),
          mobile_no: formData.mobileNo.trim(),
          residency_pincode: formData.residencyPincode.trim(),
          employment_type: formData.employmentType,
          employer_name: formData.employerName.trim() || null,
          monthly_net_income: parseFloat(formData.monthlyNetIncome),
          terms_accepted_at: new Date().toISOString(),
          referral_digit: formData.referralDigit || null
        })

      if (submitError) {
        console.error('Submission error:', submitError)
        setError('Failed to submit application. Please try again.')
      } else {
        setSuccess(true)
        // Reset form
        setFormData({
          name: '',
          mobileNo: '',
          residencyPincode: '',
          employmentType: '',
          employerName: '',
          monthlyNetIncome: '',
          referralDigit: '',
          termsAccepted: false
        })
        setReferrerInfo(null)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">Application Submitted!</CardTitle>
            <CardDescription className="text-gray-600">
              Thank you for your application. We will review it and get back to you soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">
                  Your referral has been successfully submitted and is now in progress.
                  You&apos;ll be contacted shortly for the next steps.
                </p>
              </div>
              <Button 
                onClick={() => router.push('/')} 
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Application Form
          </h1>
          <p className="text-lg text-gray-600">
            Complete your application in just a few simple steps
          </p>
        </div>

        <Card className="shadow-lg border border-gray-200 bg-white">
          <CardHeader className="bg-white border-b border-gray-200">
            <CardTitle className="text-xl font-semibold text-gray-900">Personal & Employment Information</CardTitle>
            <CardDescription className="text-gray-600">
              Please provide accurate information to process your application efficiently
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-8 p-8">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                      1
                    </div>
                    Personal Information
                  </h3>
                  <p className="text-gray-600 ml-10 mt-1">Your basic contact details</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                      Full Name *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="mobileNo" className="block text-sm font-semibold text-gray-700">
                      Mobile Number *
                    </label>
                    <Input
                      id="mobileNo"
                      name="mobileNo"
                      type="tel"
                      placeholder="Enter your 10-digit mobile number"
                      value={formData.mobileNo}
                      onChange={handleChange}
                      required
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                      maxLength={10}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="residencyPincode" className="block text-sm font-semibold text-gray-700">
                      Residency Pincode *
                    </label>
                    <Input
                      id="residencyPincode"
                      name="residencyPincode"
                      type="text"
                      placeholder="Enter your 6-digit pincode"
                      value={formData.residencyPincode}
                      onChange={handleChange}
                      required
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md max-w-xs"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-7 h-7 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                      2
                    </div>
                    Employment Information
                  </h3>
                  <p className="text-gray-600 ml-10 mt-1">Your work and income details</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="employmentType" className="block text-sm font-semibold text-gray-700">
                      Employment Type *
                    </label>
                    <Select 
                      value={formData.employmentType} 
                      onValueChange={(value) => handleSelectChange('employmentType', value)}
                    >
                      <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 rounded-md">
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-white border border-gray-300 rounded-md shadow-lg max-h-60">
                        <SelectItem value="salaried" className="py-2 px-3 hover:bg-gray-50 cursor-pointer">
                          Salaried Employee
                        </SelectItem>
                        <SelectItem value="self-employed" className="py-2 px-3 hover:bg-gray-50 cursor-pointer">
                          Self-employed / Business Owner
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="monthlyNetIncome" className="block text-sm font-semibold text-gray-700">
                      Monthly Net Income (₹) *
                    </label>
                    <Input
                      id="monthlyNetIncome"
                      name="monthlyNetIncome"
                      type="number"
                      placeholder="Enter your monthly net income"
                      value={formData.monthlyNetIncome}
                      onChange={handleChange}
                      required
                      min="0"
                      step="1000"
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                    />
                  </div>

                  {formData.employmentType === 'salaried' && (
                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="employerName" className="block text-sm font-semibold text-gray-700">
                        Employer / Company Name *
                      </label>
                      <Input
                        id="employerName"
                        name="employerName"
                        type="text"
                        placeholder="Enter your employer or company name"
                        value={formData.employerName}
                        onChange={handleChange}
                        required={formData.employmentType === 'salaried'}
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Referral Code Section - Moved to bottom */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-7 h-7 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                      3
                    </div>
                    Referral Information
                  </h3>
                  <p className="text-gray-600 ml-10 mt-1">Enter your 3-digit referral code</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="referralDigit" className="block text-sm font-semibold text-gray-700">
                      Referral Code (3 digits) *
                    </label>
                    <Input
                      id="referralDigit"
                      name="referralDigit"
                      type="text"
                      placeholder="Enter 3-digit referral code"
                      value={formData.referralDigit}
                      onChange={handleChange}
                      maxLength={3}
                      required
                      className={`h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md max-w-xs ${
                        digitError ? 'border-red-500' : ''
                      } ${referrerInfo?.exists ? 'border-green-500' : ''}`}
                    />
                    {digitError && (
                      <p className="text-xs text-red-600 mt-1">{digitError}</p>
                    )}
                    {referrerInfo?.exists && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Valid referral code from {referrerInfo.name}
                      </p>
                    )}
                    {loading && (
                      <p className="text-xs text-blue-600 mt-1">Validating referral code...</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Terms and Conditions - Header removed */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, termsAccepted: checked as boolean }))
                  }
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-700 leading-6">
                  I agree to the{' '}
                  <a href="/terms" className="text-blue-600 hover:underline font-medium" target="_blank">
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-blue-600 hover:underline font-medium" target="_blank">
                    Privacy Policy
                  </a>
                  . I understand that my personal information will be processed according to these terms.
                </label>
              </div>
            </CardContent>

            <div className="px-8 pb-8">
              <div className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 rounded-lg" 
                  disabled={submitting || !referrerInfo?.exists}
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting Application...
                    </div>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
                
                <p className="text-xs text-gray-500 text-center">
                  By submitting this application, you confirm that all information provided is accurate and complete.
                </p>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function UniversalApplicationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application form...</p>
        </div>
      </div>
    }>
      <ApplicationForm />
    </Suspense>
  )
}
