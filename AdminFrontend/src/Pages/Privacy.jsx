import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  Database,
  Users,
  FileText,
  AlertTriangle,
} from "lucide-react";

export default function Privacy() {
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center shadow-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#27AE60] to-[#2ECC71] bg-clip-text text-transparent">
                Privacy Policy
              </h1>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                Nile Flow Africa Admin Portal
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-[#E8D6B5]/10 to-[#27AE60]/5 dark:from-[#3A3A3A]/30 dark:to-[#2A2A2A]/50 border border-[#E8D6B5] dark:border-[#3A3A3A]">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#27AE60] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                  Demo Privacy Policy
                </p>
                <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                  Last updated: December 26, 2025 • This is a placeholder
                  privacy policy for demonstration purposes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Policy Content */}
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] overflow-hidden">
          <div className="p-8 md:p-12">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                Introduction
              </h2>
              <p className="text-[#2C1810] dark:text-[#F5E6D3] leading-relaxed mb-4">
                At Nile Flow Africa, we are committed to protecting your privacy
                and securing your personal information. This Privacy Policy
                explains how we collect, use, and safeguard your data when you
                use our Admin Portal.
              </p>
              <div className="p-4 rounded-xl bg-[#27AE60]/10 border border-[#27AE60]/20">
                <p className="text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                  <strong>Important:</strong> This policy applies specifically
                  to admin users of the Nile Flow Africa platform and covers
                  both personal and business data handling practices.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-4 flex items-center gap-3">
                <Database className="w-6 h-6 text-[#3498DB]" />
                1. Information We Collect
              </h2>

              <div className="space-y-6">
                <div className="p-6 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-[#FAF7F2] dark:bg-[#2A2A2A]">
                  <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#D4A017]" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 space-y-2">
                      <li>• Full name and contact details</li>
                      <li>• Email address and phone number</li>
                      <li>• Professional role and department</li>
                      <li>• Authentication credentials</li>
                    </ul>
                    <ul className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 space-y-2">
                      <li>• IP addresses and device information</li>
                      <li>• Browser type and operating system</li>
                      <li>• Access logs and session data</li>
                      <li>• Preferences and settings</li>
                    </ul>
                  </div>
                </div>

                <div className="p-6 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-[#FAF7F2] dark:bg-[#2A2A2A]">
                  <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#8E44AD]" />
                    Business Data You Handle
                  </h3>
                  <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-3">
                    Through the admin portal, you have access to:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 space-y-2">
                      <li>• Customer account information</li>
                      <li>• Transaction and payment data</li>
                      <li>• Product and inventory details</li>
                      <li>• Vendor and supplier information</li>
                    </ul>
                    <ul className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 space-y-2">
                      <li>• Order and shipping details</li>
                      <li>• Analytics and reporting data</li>
                      <li>• Customer service interactions</li>
                      <li>• Financial and accounting records</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-4 flex items-center gap-3">
                <Eye className="w-6 h-6 text-[#E74C3C]" />
                2. How We Use Your Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                    Admin Account Management
                  </h3>
                  <ul className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 space-y-2">
                    <li>• Account creation and authentication</li>
                    <li>• Access control and permissions</li>
                    <li>• Security monitoring and alerts</li>
                    <li>• Technical support and assistance</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                    Platform Operations
                  </h3>
                  <ul className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 space-y-2">
                    <li>• System performance optimization</li>
                    <li>• Audit logging and compliance</li>
                    <li>• Feature development and testing</li>
                    <li>• Legal and regulatory compliance</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-4 flex items-center gap-3">
                <Lock className="w-6 h-6 text-[#27AE60]" />
                3. Data Security & Protection
              </h2>

              <div className="p-6 rounded-xl bg-gradient-to-r from-[#27AE60]/5 to-[#2ECC71]/5 border border-[#27AE60]/20 mb-6">
                <p className="text-[#2C1810] dark:text-[#F5E6D3] leading-relaxed mb-4">
                  We implement comprehensive security measures to protect all
                  data within our admin portal:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl border border-[#3498DB]/20 bg-[#3498DB]/5">
                  <h3 className="font-semibold text-[#3498DB] mb-3">
                    Encryption
                  </h3>
                  <ul className="text-xs text-[#2C1810] dark:text-[#F5E6D3] space-y-1">
                    <li>• AES-256 data encryption</li>
                    <li>• TLS 1.3 for transmission</li>
                    <li>• Encrypted database storage</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-[#E67E22]/20 bg-[#E67E22]/5">
                  <h3 className="font-semibold text-[#E67E22] mb-3">
                    Access Control
                  </h3>
                  <ul className="text-xs text-[#2C1810] dark:text-[#F5E6D3] space-y-1">
                    <li>• Multi-factor authentication</li>
                    <li>• Role-based permissions</li>
                    <li>• Session management</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-[#8E44AD]/20 bg-[#8E44AD]/5">
                  <h3 className="font-semibold text-[#8E44AD] mb-3">
                    Monitoring
                  </h3>
                  <ul className="text-xs text-[#2C1810] dark:text-[#F5E6D3] space-y-1">
                    <li>• 24/7 security monitoring</li>
                    <li>• Intrusion detection</li>
                    <li>• Automated alerts</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Sharing */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                4. Data Sharing & Third Parties
              </h2>

              <div className="space-y-6">
                <div className="p-6 rounded-xl border border-[#27AE60]/20 bg-[#27AE60]/5">
                  <h3 className="font-semibold text-[#27AE60] mb-3">
                    We DO Share With:
                  </h3>
                  <ul className="text-sm text-[#2C1810] dark:text-[#F5E6D3] space-y-2">
                    <li>
                      • <strong>Service Providers:</strong> Cloud hosting,
                      payment processing, and analytics services
                    </li>
                    <li>
                      • <strong>Legal Authorities:</strong> When required by law
                      or to protect our rights
                    </li>
                    <li>
                      • <strong>Business Partners:</strong> Authorized
                      integrations and API partners (with your consent)
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-xl border border-[#E74C3C]/20 bg-[#E74C3C]/5">
                  <h3 className="font-semibold text-[#E74C3C] mb-3">
                    We DO NOT Share With:
                  </h3>
                  <ul className="text-sm text-[#2C1810] dark:text-[#F5E6D3] space-y-2">
                    <li>
                      • <strong>Advertisers:</strong> We never sell personal
                      data to advertising companies
                    </li>
                    <li>
                      • <strong>Data Brokers:</strong> Your information is not
                      sold to third-party data companies
                    </li>
                    <li>
                      • <strong>Competitors:</strong> Business data remains
                      confidential and secure
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                5. Your Data Rights
              </h2>

              <p className="text-[#2C1810] dark:text-[#F5E6D3] leading-relaxed mb-6">
                As an admin user, you have the following rights regarding your
                personal data:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[#D4A017]/20 bg-[#D4A017]/5">
                  <h3 className="font-semibold text-[#D4A017] mb-2">
                    Access & Control
                  </h3>
                  <ul className="text-sm text-[#2C1810] dark:text-[#F5E6D3] space-y-1">
                    <li>• View your personal data</li>
                    <li>• Update account information</li>
                    <li>• Export your data</li>
                    <li>• Delete your account</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-[#8E44AD]/20 bg-[#8E44AD]/5">
                  <h3 className="font-semibold text-[#8E44AD] mb-2">
                    Privacy Control
                  </h3>
                  <ul className="text-sm text-[#2C1810] dark:text-[#F5E6D3] space-y-1">
                    <li>• Opt-out of communications</li>
                    <li>• Restrict data processing</li>
                    <li>• Object to automated decisions</li>
                    <li>• Request data portability</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                6. Data Retention
              </h2>

              <div className="p-6 rounded-xl bg-[#F39C12]/10 border border-[#F39C12]/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-3">
                      Admin Account Data
                    </h3>
                    <ul className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 space-y-2">
                      <li>• Profile information: Until account deletion</li>
                      <li>• Access logs: 2 years for security purposes</li>
                      <li>• Session data: 30 days after logout</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-3">
                      Business Data
                    </h3>
                    <ul className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 space-y-2">
                      <li>
                        • Transaction records: 7 years (legal requirement)
                      </li>
                      <li>• Customer data: Per customer's preferences</li>
                      <li>• Analytics data: Aggregated, anonymized</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Changes to Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-4 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-[#F39C12]" />
                7. Changes to This Policy
              </h2>

              <p className="text-[#2C1810] dark:text-[#F5E6D3] leading-relaxed mb-4">
                We may update this Privacy Policy to reflect changes in our
                practices or legal requirements. We will notify all admin users
                of material changes through:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-[#3498DB]/10 text-center">
                  <p className="text-sm font-medium text-[#3498DB]">
                    Email Notification
                  </p>
                  <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                    30 days advance notice
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#E67E22]/10 text-center">
                  <p className="text-sm font-medium text-[#E67E22]">
                    Portal Banner
                  </p>
                  <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                    Prominent notification
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#8E44AD]/10 text-center">
                  <p className="text-sm font-medium text-[#8E44AD]">
                    Version History
                  </p>
                  <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                    Track all changes
                  </p>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                8. Contact Our Privacy Team
              </h2>

              <div className="p-6 rounded-xl bg-gradient-to-r from-[#27AE60]/10 to-[#2ECC71]/10 border border-[#27AE60]/20">
                <p className="text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                  For privacy-related questions, data requests, or concerns:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                    <p>
                      <strong>Privacy Officer:</strong>{" "}
                      privacy@nileflowafrica.com
                    </p>
                    <p>
                      <strong>Data Protection:</strong> dpo@nileflowafrica.com
                    </p>
                    <p>
                      <strong>Security Issues:</strong>{" "}
                      security@nileflowafrica.com
                    </p>
                  </div>
                  <div className="space-y-2 text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                    <p>
                      <strong>Phone:</strong> +234 (0) 800 PRIVACY
                    </p>
                    <p>
                      <strong>Address:</strong> Data Protection Office
                    </p>
                    <p>Victoria Island, Lagos, Nigeria</p>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-white/50 dark:bg-[#2A2A2A]/50">
                  <p className="text-xs text-[#2C1810] dark:text-[#F5E6D3]">
                    <strong>Response Time:</strong> We respond to privacy
                    requests within 5 business days and provide resolution
                    within 30 days as required by applicable data protection
                    laws.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#8B4513]/50 dark:text-[#D4A017]/50">
            © 2025 Nile Flow Africa. All rights reserved. • This privacy policy
            is compliant with GDPR, CCPA, and Nigerian Data Protection
            Regulation (NDPR).
          </p>
        </div>
      </div>
    </div>
  );
}
