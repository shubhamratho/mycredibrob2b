'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { testDatabaseConnection, checkRequiredTables } from '@/lib/database-test'
import { CheckCircle, XCircle, AlertCircle, Database, FileText, Play } from 'lucide-react'

export function DatabaseSetupGuide() {
  const [testing, setTesting] = useState(false)
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; error?: string; message?: string } | null>(null)
  const [tableResults, setTableResults] = useState<Array<{ name: string; exists: boolean; error?: string }>>([])

  const testConnection = async () => {
    setTesting(true)
    try {
      const result = await testDatabaseConnection()
      setConnectionResult(result)
      
      if (result.success) {
        const tables = await checkRequiredTables()
        setTableResults(tables)
      }
    } catch (err) {
      setConnectionResult({
        success: false,
        message: `Test failed: ${(err as Error).message}`,
        needsMigration: false
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Setup Guide
        </CardTitle>
        <CardDescription>
          Follow these steps to set up your Supabase database for the MyCredibro B2B application
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Step 1: Environment Variables */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
            Environment Variables
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              Make sure your <code className="bg-gray-200 px-1 rounded">.env.local</code> file contains:
            </p>
            <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here`}
            </pre>
          </div>
        </div>

        {/* Step 2: SQL Migration */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
            Run SQL Migration
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">Copy the SQL migration</p>
                <p className="text-sm text-gray-600">
                  Open <code className="bg-gray-200 px-1 rounded">supabase-migration.sql</code> and copy all contents
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Play className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Execute in Supabase</p>
                <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1 mt-1">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to SQL Editor</li>
                  <li>Create a new query</li>
                  <li>Paste the migration SQL</li>
                  <li>Click &quot;Run&quot; to execute</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Test Connection */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
            Test Database Connection
          </h3>
          <div className="space-y-3">
            <Button onClick={testConnection} disabled={testing} className="flex items-center gap-2">
              {testing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Play className="h-4 w-4" />
              )}
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>

            {connectionResult && (
              <div className={`p-4 rounded-lg border ${
                connectionResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {connectionResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    connectionResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {connectionResult.success ? 'Success!' : 'Failed'}
                  </span>
                </div>
                <p className={`text-sm ${
                  connectionResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {connectionResult.message}
                </p>
                
                {connectionResult.needsMigration && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-800 font-medium">Action Required</span>
                    </div>
                    <p className="text-yellow-700 text-sm mt-1">
                      Please run the SQL migration as described in Step 2 above.
                    </p>
                  </div>
                )}
              </div>
            )}

            {tableResults.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Database Tables Status:</h4>
                <div className="space-y-2">
                  {tableResults.map((result, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {result.exists ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">
                        <code className="bg-gray-200 px-1 rounded">{result.table}</code>
                        {result.exists ? ' - Found' : ' - Missing'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {connectionResult?.success && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Setup Complete!</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Your database is properly configured. You can now use all features of the application.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
