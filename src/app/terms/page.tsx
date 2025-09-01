import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms and Conditions</CardTitle>
            <p className="text-gray-600 mt-2">Last updated: September 2025</p>
          </CardHeader>
          <CardContent className="space-y-8">
            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">1. Acceptance of Terms</h3>
              <p className="text-gray-700 leading-relaxed">
                By submitting this application form, you acknowledge that you have read, understood, 
                and agree to be bound by these Terms and Conditions. If you do not agree to these 
                terms, please do not submit your application.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">2. Application Process</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                Your application will be reviewed based on our lending criteria. Submission of this 
                form does not guarantee approval. We reserve the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Request additional documentation and information</li>
                <li>Verify the information provided through third-party sources</li>
                <li>Approve, modify, or decline your application at our discretion</li>
                <li>Set terms and conditions for any approved application</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">3. Information Accuracy</h3>
              <p className="text-gray-700 leading-relaxed">
                You warrant that all information provided in your application is true, complete, 
                and accurate. Any false or misleading information may result in immediate rejection 
                of your application or termination of any approved facility.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">4. Communication</h3>
              <p className="text-gray-700 leading-relaxed">
                By providing your contact information, you consent to receive communications regarding 
                your application via phone calls, SMS, email, and other electronic means. You may 
                opt-out of marketing communications at any time, but service-related communications 
                will continue as necessary.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">5. Credit Checks and Verification</h3>
              <p className="text-gray-700 leading-relaxed">
                We may perform credit checks and verify your information with credit bureaus, 
                employers, banks, and other relevant parties as part of our assessment process. 
                You authorize us to make such inquiries.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">6. Limitation of Liability</h3>
              <p className="text-gray-700 leading-relaxed">
                Our liability in connection with your application is limited to the maximum extent 
                permitted by law. We shall not be liable for any indirect, incidental, or 
                consequential damages arising from the application process.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">7. Governing Law</h3>
              <p className="text-gray-700 leading-relaxed">
                These terms shall be governed by and construed in accordance with the laws of India. 
                Any disputes arising shall be subject to the exclusive jurisdiction of the courts 
                in the relevant jurisdiction.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">8. Changes to Terms</h3>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these terms at any time. Updated terms will be 
                posted on our website with the revision date. Your continued use of our services 
                constitutes acceptance of any changes.
              </p>
            </section>

            <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">Contact Information</h4>
              <p className="text-blue-800">
                For questions about these terms or your application, please contact our support team 
                through the contact information provided on our website.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
