'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

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

export default function ReferralFormPage() {
  const params = useParams()
  const router = useRouter()
  const refCode = params?.refCode as string

  const [referrerExists, setReferrerExists] = useState<boolean | null>(null)
  const [referrerName, setReferrerName] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    mobileNo: '',
    residencyPincode: '',
    employmentType: '',
    employerName: '',
    monthlyNetIncome: '',
    referralDigit: '',
    termsAccepted: false
  })

  const checkReferrer = useCallback(async () => {
    try {
      setLoading(true)
      
      // Check if the referrer exists
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', refCode)
        .single()

      if (error || !data) {
        setReferrerExists(false)
      } else {
        setReferrerExists(true)
        setReferrerName(data.name)
      }
    } catch (err) {
      console.error('Error checking referrer:', err)
      setReferrerExists(false)
    } finally {
      setLoading(false)
    }
  }, [refCode])

  useEffect(() => {
    if (refCode) {
      checkReferrer()
    }
  }, [refCode, checkReferrer])

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Validation functions
  const validateMobileNumber = (mobile: string): string | null => {
    const cleanMobile = mobile.replace(/[^\d]/g, '')
    if (cleanMobile.length !== 10) {
      return 'Mobile number must be exactly 10 digits'
    }
    if (!cleanMobile.match(/^[6-9]/)) {
      return 'Mobile number must start with 6, 7, 8, or 9'
    }
    return null
  }

  const validatePincode = (pincode: string): string | null => {
    const cleanPincode = pincode.replace(/[^\d]/g, '')
    if (cleanPincode.length !== 6) {
      return 'Pincode must be exactly 6 digits'
    }
    return null
  }

  const validateReferralDigit = (digit: string): string | null => {
    if (!digit.trim()) return null // Optional field
    const cleanDigit = digit.replace(/[^\d]/g, '')
    if (cleanDigit.length !== 3) {
      return 'Referral digit must be exactly 3 digits'
    }
    return null
  }

  const validateForm = (): string | null => {
    // Mobile number validation
    const mobileError = validateMobileNumber(formData.mobileNo)
    if (mobileError) return mobileError

    // Pincode validation
    const pincodeError = validatePincode(formData.residencyPincode)
    if (pincodeError) return pincodeError

    // Referral digit validation (optional)
    const referralDigitError = validateReferralDigit(formData.referralDigit)
    if (referralDigitError) return referralDigitError

    // Employment type validation
    if (formData.employmentType === 'salaried' && !formData.employerName.trim()) {
      return 'Employer name is required for salaried employees'
    }

    // Terms validation
    if (!formData.termsAccepted) {
      return 'Please accept the terms and conditions'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSubmitting(true)
      setError('')

      let referralDigitUserId = null
      
      // If referral digit is provided, find the user with that digit
      if (formData.referralDigit.trim()) {
        const { data: referralUser, error: referralError } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_digit', formData.referralDigit.trim())
          .single()

        if (referralError || !referralUser) {
          setError('Invalid referral digit. Please check and try again.')
          return
        }
        referralDigitUserId = referralUser.id
      }

      const { error: insertError } = await supabase
        .from('referrals')
        .insert({
          referrer_user_id: refCode,
          name: formData.name.trim(),
          mobile_no: formData.mobileNo.replace(/[^\d]/g, ''), // Store only digits
          residency_pincode: formData.residencyPincode.replace(/[^\d]/g, ''), // Store only digits
          employment_type: formData.employmentType,
          employer_name: formData.employmentType === 'salaried' ? formData.employerName.trim() : null,
          monthly_net_income: parseFloat(formData.monthlyNetIncome),
          referral_digit: formData.referralDigit.trim() || null,
          terms_accepted_at: new Date().toISOString(),
          status: 'InProgress'
        })

      if (insertError) {
        throw insertError
      }

      setSuccess(true)
    } catch (err) {
      console.error('Error submitting referral:', err)
      setError((err as Error).message || 'Failed to submit referral. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (referrerExists === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Referral Link</CardTitle>
            <CardDescription>
              This referral link is not valid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-green-600">Application Submitted!</CardTitle>
            <CardDescription>
              Thank you for your application. We&apos;ll review it and get back to you soon.
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
                onClick={() => router.push('/login')} 
                className="w-full"
              >
                Go to Login
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
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="mobileNo" className="block text-sm font-semibold text-gray-700">
                      Mobile Number *
                    </label>
                    <Input
                      id="mobileNo"
                      type="tel"
                      required
                      value={formData.mobileNo}
                      onChange={(e) => {
                        // Only allow numbers and limit to 10 digits
                        const value = e.target.value.replace(/[^\d]/g, '').slice(0, 10)
                        handleInputChange('mobileNo', value)
                      }}
                      placeholder="Enter your 10-digit mobile number"
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                      maxLength={10}
                    />
                    {formData.mobileNo && validateMobileNumber(formData.mobileNo) && (
                      <p className="text-xs text-red-600 mt-1">
                        {validateMobileNumber(formData.mobileNo)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="residencyPincode" className="block text-sm font-semibold text-gray-700">
                      Residency Pincode *
                    </label>
                    <Input
                      id="residencyPincode"
                      type="text"
                      required
                      value={formData.residencyPincode}
                      onChange={(e) => {
                        // Only allow numbers and limit to 6 digits
                        const value = e.target.value.replace(/[^\d]/g, '').slice(0, 6)
                        handleInputChange('residencyPincode', value)
                      }}
                      placeholder="Enter your 6-digit pincode"
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md max-w-xs"
                      maxLength={6}
                    />
                    {formData.residencyPincode && validatePincode(formData.residencyPincode) && (
                      <p className="text-xs text-red-600 mt-1">
                        {validatePincode(formData.residencyPincode)}
                      </p>
                    )}
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
                      onValueChange={(value) => handleInputChange('employmentType', value)}
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
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={formData.monthlyNetIncome}
                      onChange={(e) => handleInputChange('monthlyNetIncome', e.target.value)}
                      placeholder="Enter your monthly net income"
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
                        type="text"
                        required={formData.employmentType === 'salaried'}
                        value={formData.employerName}
                        onChange={(e) => handleInputChange('employerName', e.target.value)}
                        placeholder="Enter your employer or company name"
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Terms and Conditions - Header removed */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={formData.termsAccepted}
                    onCheckedChange={(checked) => handleInputChange('termsAccepted', checked as boolean)}
                    className="mt-1"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed">
                    I have read and agree to the{' '}
                    <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-700 font-semibold underline">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-700 font-semibold underline">
                      Privacy Policy
                    </a>. I consent to the processing of my personal data for application review and processing purposes.
                  </label>
                </div>
              </div>
            </CardContent>

            <div className="px-8 pb-8">
              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-sm transition-colors duration-200" 
                disabled={submitting || !formData.termsAccepted}
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting Application...
                  </div>
                ) : (
                  'Submit Application'
                )}
              </Button>
              
              <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Your information is secure and encrypted
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
