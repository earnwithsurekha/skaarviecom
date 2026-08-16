'use client';

import { useRouter } from 'next/navigation';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

export default function PendingApprovalPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-warning-50 via-white to-warning-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="card">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-warning-100 rounded-full mb-6">
            <Clock className="w-10 h-10 text-warning-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Registration Under Review
          </h1>
          
          <p className="text-gray-600 mb-6">
            Thank you for registering as a manufacturer on Skaarvi Marketplace. 
            Your application is currently being reviewed by our team.
          </p>

          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-warning-800">
              <strong>What's next?</strong><br />
              Our team will verify your documents and business details. 
              You'll receive an email notification once your account is approved.
            </p>
          </div>

          <div className="space-y-3 text-left mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Documents Submitted</p>
                <p className="text-xs text-gray-600">GST, PAN, and Address Proof</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Business Details Verified</p>
                <p className="text-xs text-gray-600">Company information received</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Admin Approval Pending</p>
                <p className="text-xs text-gray-600">Usually takes 1-2 business days</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-600 mb-4">
              Need help? Contact our support team
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/register')}
                className="btn btn-outline flex-1"
              >
                Back to Register
              </button>
              <a
                href="mailto:support@skaarvi.com"
                className="btn btn-primary flex-1"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
