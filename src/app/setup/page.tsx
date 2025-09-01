import { DatabaseSetupGuide } from '@/components/DatabaseSetupGuide'

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">MyCredibro B2B Setup</h1>
          <p className="mt-2 text-gray-600">
            Configure your database to get started
          </p>
        </div>
        
        <DatabaseSetupGuide />
      </div>
    </div>
  )
}
