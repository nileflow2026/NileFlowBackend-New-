import React from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  Shield,
  ArrowLeft,
  Lock,
  Eye,
  Database,
  Users,
  Globe,
  AlertCircle,
} from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-gray-900/10 to-emerald-900/10"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-red-500/10 to-amber-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

      <div className="relative min-h-screen px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            to="/signup"
            className="inline-flex items-center space-x-2 text-amber-300 hover:text-amber-200 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign Up</span>
          </Link>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-emerald-300 via-green-200 to-amber-200 bg-clip-text text-transparent">
                Privacy Policy
              </span>
            </h1>
            <p className="text-amber-100/70 text-lg">
              Last Updated: December 21, 2025
            </p>
          </div>

          {/* Content */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8 md:p-12 space-y-8">
            {/* Introduction */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-emerald-200">
                  1. Introduction
                </h2>
              </div>
              <p className="text-amber-100/80 leading-relaxed">
                At Nile Flow Africa, we take your privacy seriously. This
                Privacy Policy explains how we collect, use, disclose, and
                safeguard your information when you use our platform. Please
                read this policy carefully to understand our practices regarding
                your personal data.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Database className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-emerald-200">
                  2. Information We Collect
                </h2>
              </div>
              <div className="text-amber-100/80 leading-relaxed space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-amber-200 mb-2">
                    Personal Information
                  </h3>
                  <p className="mb-2">
                    We collect information that you provide directly to us,
                    including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Name and username</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Shipping and billing addresses</li>
                    <li>
                      Payment information (processed securely by our payment
                      providers)
                    </li>
                    <li>Profile picture and preferences</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-amber-200 mb-2">
                    Usage Information
                  </h3>
                  <p className="mb-2">
                    We automatically collect information about your interactions
                    with our platform:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Browser type and version</li>
                    <li>Device information and IP address</li>
                    <li>Pages visited and time spent on the platform</li>
                    <li>Products viewed and purchased</li>
                    <li>Search queries and preferences</li>
                    <li>Nile Miles activity and redemptions</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-amber-200 mb-2">
                    Cookies and Tracking
                  </h3>
                  <p>
                    We use cookies, web beacons, and similar technologies to
                    enhance your experience, analyze usage patterns, and deliver
                    personalized content and advertisements.
                  </p>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Eye className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-emerald-200">
                  3. How We Use Your Information
                </h2>
              </div>
              <div className="text-amber-100/80 leading-relaxed space-y-3">
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Process and fulfill your orders</li>
                  <li>Manage your account and Nile Miles</li>
                  <li>Send order confirmations and updates</li>
                  <li>Provide customer support</li>
                  <li>Personalize your shopping experience</li>
                  <li>Send promotional emails (with your consent)</li>
                  <li>Improve our products and services</li>
                  <li>Detect and prevent fraud</li>
                  <li>Comply with legal obligations</li>
                  <li>Analyze usage trends and optimize our platform</li>
                </ul>
              </div>
            </section>

            {/* Information Sharing */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-emerald-200">
                  4. Information Sharing and Disclosure
                </h2>
              </div>
              <div className="text-amber-100/80 leading-relaxed space-y-3">
                <p>We may share your information with:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Service Providers:</strong> Third-party companies
                    that help us operate our platform (payment processors,
                    shipping companies, analytics providers)
                  </li>
                  <li>
                    <strong>Business Partners:</strong> Trusted partners for
                    marketing and promotional purposes (with your consent)
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> When required by law or
                    to protect our rights and safety
                  </li>
                  <li>
                    <strong>Business Transfers:</strong> In the event of a
                    merger, acquisition, or sale of assets
                  </li>
                </ul>
                <p className="mt-4">
                  We do not sell your personal information to third parties for
                  their marketing purposes.
                </p>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Lock className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-emerald-200">
                  5. Data Security
                </h2>
              </div>
              <p className="text-amber-100/80 leading-relaxed">
                We implement industry-standard security measures to protect your
                personal information, including encryption, secure servers, and
                regular security audits. However, no method of transmission over
                the internet is 100% secure, and we cannot guarantee absolute
                security. We encourage you to use strong passwords and keep your
                account credentials confidential.
              </p>
            </section>

            {/* Your Rights and Choices */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-emerald-200">
                  6. Your Rights and Choices
                </h2>
              </div>
              <div className="text-amber-100/80 leading-relaxed space-y-3">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Access:</strong> Request a copy of your personal
                    data
                  </li>
                  <li>
                    <strong>Correction:</strong> Update or correct inaccurate
                    information
                  </li>
                  <li>
                    <strong>Deletion:</strong> Request deletion of your account
                    and data
                  </li>
                  <li>
                    <strong>Opt-Out:</strong> Unsubscribe from marketing emails
                    at any time
                  </li>
                  <li>
                    <strong>Data Portability:</strong> Request your data in a
                    portable format
                  </li>
                  <li>
                    <strong>Object:</strong> Object to certain processing of
                    your data
                  </li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, please contact us at
                  privacy@nileflowafrica.com
                </p>
              </div>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-emerald-200 mb-4">
                7. Children's Privacy
              </h2>
              <p className="text-amber-100/80 leading-relaxed">
                Our services are not intended for children under 13 years of
                age. We do not knowingly collect personal information from
                children. If you become aware that a child has provided us with
                personal information, please contact us immediately, and we will
                take steps to delete such information.
              </p>
            </section>

            {/* International Data Transfers */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Globe className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-emerald-200">
                  8. International Data Transfers
                </h2>
              </div>
              <p className="text-amber-100/80 leading-relaxed">
                Your information may be transferred to and processed in
                countries other than your own. We ensure that appropriate
                safeguards are in place to protect your data in accordance with
                this Privacy Policy and applicable laws.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-emerald-200 mb-4">
                9. Data Retention
              </h2>
              <p className="text-amber-100/80 leading-relaxed">
                We retain your personal information for as long as necessary to
                fulfill the purposes outlined in this policy, comply with legal
                obligations, resolve disputes, and enforce our agreements. When
                we no longer need your information, we will securely delete or
                anonymize it.
              </p>
            </section>

            {/* Third-Party Links */}
            <section>
              <h2 className="text-2xl font-bold text-emerald-200 mb-4">
                10. Third-Party Links
              </h2>
              <p className="text-amber-100/80 leading-relaxed">
                Our platform may contain links to third-party websites. We are
                not responsible for the privacy practices of these external
                sites. We encourage you to review their privacy policies before
                providing any personal information.
              </p>
            </section>

            {/* Changes to This Policy */}
            <section>
              <h2 className="text-2xl font-bold text-emerald-200 mb-4">
                11. Changes to This Privacy Policy
              </h2>
              <p className="text-amber-100/80 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect
                changes in our practices or legal requirements. We will notify
                you of significant changes by posting the updated policy on this
                page and updating the "Last Updated" date. We encourage you to
                review this policy periodically.
              </p>
            </section>

            {/* Contact Us */}
            <section>
              <h2 className="text-2xl font-bold text-emerald-200 mb-4">
                12. Contact Us
              </h2>
              <div className="text-amber-100/80 leading-relaxed space-y-2">
                <p>
                  If you have any questions, concerns, or requests regarding
                  this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-gradient-to-r from-emerald-900/20 to-amber-900/20 backdrop-blur-sm border border-emerald-800/30 rounded-xl p-4 mt-4">
                  <p>Email: privacy@nileflowafrica.com</p>
                  <p>Phone: +254 703 115 359</p>
                  <p>Address: Kilimani, Nairobi, Kenya</p>
                  <p className="mt-2 text-sm text-amber-100/60">
                    Data Protection Officer: dpo@nileflowafrica.com
                  </p>
                </div>
              </div>
            </section>

            {/* Your Consent */}
            <section className="bg-gradient-to-r from-emerald-900/20 to-green-900/20 backdrop-blur-sm border border-emerald-800/30 rounded-xl p-6">
              <p className="text-amber-100/90 leading-relaxed">
                By using Nile Flow Africa, you consent to the collection, use,
                and disclosure of your information as described in this Privacy
                Policy. If you do not agree with this policy, please do not use
                our services.
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
