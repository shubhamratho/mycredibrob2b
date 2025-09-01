import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-gray-600 mt-2">Last updated: September 2025</p>
          </CardHeader>
          <CardContent className="space-y-8">
            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">1. Information We Collect</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Personal identification information (name, mobile number, address)</li>
                <li>Employment and income details</li>
                <li>Financial information for loan assessment</li>
                <li>Communication preferences and history</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">2. How We Use Your Information</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Process and evaluate your loan application</li>
                <li>Verify your identity and employment</li>
                <li>Communicate with you about your application</li>
                <li>Comply with legal and regulatory requirements</li>
                <li>Improve our services and user experience</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">3. Information Sharing and Disclosure</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations or court orders</li>
                <li>With credit bureaus and verification agencies for assessment purposes</li>
                <li>With our service providers who assist in application processing</li>
                <li>In connection with business transfers or acquisitions</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">4. Data Security</h3>
              <p className="text-gray-700 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your 
                personal information against unauthorized access, alteration, disclosure, or 
                destruction. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">5. Data Retention</h3>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the 
                purposes for which it was collected, comply with legal obligations, resolve 
                disputes, and enforce our agreements.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">6. Your Rights</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Access and review your personal information</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your information (subject to legal requirements)</li>
                <li>Opt-out of marketing communications</li>
                <li>Lodge a complaint with relevant data protection authorities</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">7. Cookies and Tracking Technologies</h3>
              <p className="text-gray-700 leading-relaxed">
                We may use cookies and similar tracking technologies to enhance your experience 
                on our website, analyze usage patterns, and improve our services. You can 
                control cookie settings through your browser preferences.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">8. Third-Party Links</h3>
              <p className="text-gray-700 leading-relaxed">
                Our website may contain links to third-party websites. We are not responsible 
                for the privacy practices or content of these external sites. We encourage 
                you to review their privacy policies.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">9. Changes to This Privacy Policy</h3>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of 
                any significant changes by posting the new policy on our website with the 
                updated date.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">10. Contact Us</h3>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, 
                please contact us through the contact information provided on our website.
              </p>
            </section>

            <div className="mt-12 p-6 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-lg font-semibold text-green-900 mb-2">Your Privacy Matters</h4>
              <p className="text-green-800">
                We are committed to protecting your privacy and handling your personal 
                information with care and transparency. This policy explains how we collect, 
                use, and protect your information.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
