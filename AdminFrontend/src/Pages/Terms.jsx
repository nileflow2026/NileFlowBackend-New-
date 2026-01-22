import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-[#F5F0E6] to-[#FAF7F2] dark:from-[#1A1A1A] dark:via-[#242424] dark:to-[#1A1A1A] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#8B4513] dark:text-[#D4A017] hover:text-[#B8860B] dark:hover:text-[#FFD700] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Registration
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#D4A017] to-[#8B6914] flex items-center justify-center shadow-xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#D4A017] to-[#8B6914] bg-clip-text text-transparent">
                Terms of Service
              </h1>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                Nile Flow Africa Admin Portal
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-[#E8D6B5]/10 to-[#D4A017]/5 dark:from-[#3A3A3A]/30 dark:to-[#2A2A2A]/50 border border-[#E8D6B5] dark:border-[#3A3A3A]">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#D4A017] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                  Demo Terms of Service
                </p>
                <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                  Last updated: December 26, 2025 • These are placeholder terms
                  for demonstration purposes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Terms Content */}
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] overflow-hidden">
          <div className="p-8 md:p-12">
            {/* Section 1: Acceptance of Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#27AE60]" />
                1. Acceptance of Terms
              </h2>
              <p className="text-[#2C1810] dark:text-[#F5E6D3] leading-relaxed mb-4">
                By accessing and using the Nile Flow Africa Admin Portal
                ("Service"), you accept and agree to be bound by the terms and
                provision of this agreement. If you do not agree to abide by the
                above, please do not use this service.
              </p>
              <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70 leading-relaxed">
                These Terms of Service constitute a legally binding agreement
                between you ("Admin", "you", or "your") and Nile Flow Africa
                ("Company", "we", "us", or "our").
              </p>
            </section>

            {/* Section 2: Admin Responsibilities */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-4 flex items-center gap-3">
                <Shield className="w-6 h-6 text-[#3498DB]" />
                2. Admin Responsibilities
              </h2>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#2A2A2A] border border-[#E8D6B5] dark:border-[#3A3A3A]">
                  <h3 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
                    Account Security
                  </h3>
                  <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                    You are responsible for maintaining the confidentiality of
                    your admin credentials and for all activities that occur
                    under your account.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#2A2A2A] border border-[#E8D6B5] dark:border-[#3A3A3A]">
                  <h3 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
                    Data Management
                  </h3>
                  <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                    You must handle all customer and business data in accordance
                    with applicable data protection laws and company policies.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#2A2A2A] border border-[#E8D6B5] dark:border-[#3A3A3A]">
                  <h3 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
                    Professional Conduct
                  </h3>
                  <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                    You agree to use the admin portal professionally and in
                    compliance with all applicable laws and regulations.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3: Service Availability */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                3. Service Availability
              </h2>
              <p className="text-[#2C1810] dark:text-[#F5E6D3] leading-relaxed mb-4">
                We strive to maintain 99.9% uptime for the admin portal.
                However, we do not guarantee uninterrupted service and may
                perform maintenance that temporarily affects availability.
              </p>
              <ul className="list-disc list-inside text-[#8B4513]/70 dark:text-[#D4A017]/70 space-y-2">
                <li>Scheduled maintenance will be announced in advance</li>
                <li>Emergency maintenance may occur without notice</li>
                <li>Service credits may apply for extended outages</li>
              </ul>
            </section>

            {/* Section 4: Data Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                4. Data Privacy & Security
              </h2>
              <p className="text-[#2C1810] dark:text-[#F5E6D3] leading-relaxed mb-4">
                We implement industry-standard security measures to protect your
                data and the data you manage through our platform.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[#27AE60] bg-[#27AE60]/5">
                  <h4 className="font-semibold text-[#27AE60] mb-2">
                    We Provide
                  </h4>
                  <ul className="text-sm text-[#2C1810] dark:text-[#F5E6D3] space-y-1">
                    <li>• End-to-end encryption</li>
                    <li>• Regular security audits</li>
                    <li>• Access logging</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl border border-[#E74C3C] bg-[#E74C3C]/5">
                  <h4 className="font-semibold text-[#E74C3C] mb-2">
                    You Must
                  </h4>
                  <ul className="text-sm text-[#2C1810] dark:text-[#F5E6D3] space-y-1">
                    <li>• Use strong passwords</li>
                    <li>• Log out when finished</li>
                    <li>• Report security incidents</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 5: Prohibited Activities */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                5. Prohibited Activities
              </h2>
              <div className="p-6 rounded-xl bg-gradient-to-r from-[#E74C3C]/5 to-[#C0392B]/5 border border-[#E74C3C]/20">
                <p className="text-[#2C1810] dark:text-[#F5E6D3] leading-relaxed mb-4">
                  The following activities are strictly prohibited:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 space-y-2">
                    <li>• Unauthorized access to customer accounts</li>
                    <li>• Sharing admin credentials with third parties</li>
                    <li>• Attempting to breach system security</li>
                    <li>• Using the platform for illegal activities</li>
                  </ul>
                  <ul className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 space-y-2">
                    <li>• Manipulating financial data without authorization</li>
                    <li>• Accessing systems beyond your permission level</li>
                    <li>• Reverse engineering the platform</li>
                    <li>• Creating unauthorized reports or exports</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 6: Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                6. Account Termination
              </h2>
              <p className="text-[#2C1810] dark:text-[#F5E6D3] leading-relaxed mb-4">
                We reserve the right to suspend or terminate admin accounts for
                violations of these terms or suspicious activity.
              </p>
              <div className="p-4 rounded-xl bg-[#F39C12]/10 border border-[#F39C12]/20">
                <p className="text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                  <strong>Notice:</strong> Account termination may result in
                  immediate loss of access to all administrative functions. Data
                  export options may be available upon request.
                </p>
              </div>
            </section>

            {/* Section 7: Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                7. Changes to These Terms
              </h2>
              <p className="text-[#2C1810] dark:text-[#F5E6D3] leading-relaxed">
                We may update these Terms of Service from time to time. We will
                notify all admin users of any material changes via email and
                through the admin portal notification system.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                8. Contact Information
              </h2>
              <div className="p-6 rounded-xl bg-gradient-to-r from-[#D4A017]/10 to-[#B8860B]/10 border border-[#D4A017]/20">
                <p className="text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                  If you have any questions about these Terms of Service, please
                  contact us:
                </p>
                <div className="space-y-2 text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  <p>
                    <strong>Email:</strong> admin-support@nileflowafrica.com
                  </p>
                  <p>
                    <strong>Phone:</strong> +234 (0) 800 NILE FLOW
                  </p>
                  <p>
                    <strong>Address:</strong> Victoria Island, Lagos, Nigeria
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#8B4513]/50 dark:text-[#D4A017]/50">
            © 2025 Nile Flow Africa. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
