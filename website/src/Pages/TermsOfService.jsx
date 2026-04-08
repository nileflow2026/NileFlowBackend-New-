import React from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { FileText, Shield, ArrowLeft, Scale, AlertCircle } from "lucide-react";

const TermsOfService = () => {
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
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 mb-6">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
                Terms of Service
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
                <Scale className="w-6 h-6 text-amber-400" />
                <h2 className="text-2xl font-bold text-amber-200">
                  1. Introduction
                </h2>
              </div>
              <p className="text-amber-100/80 leading-relaxed">
                Welcome to Nile Flow. By accessing or using our platform, you
                agree to be bound by these Terms of Service. Please read them
                carefully. If you do not agree with any part of these terms, you
                may not use our services.
              </p>
            </section>

            {/* Account Registration */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-amber-400" />
                <h2 className="text-2xl font-bold text-amber-200">
                  2. Account Registration
                </h2>
              </div>
              <div className="text-amber-100/80 leading-relaxed space-y-3">
                <p>
                  To access certain features of Nile Flow, you must register for
                  an account. When you register, you agree to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide accurate, current, and complete information</li>
                  <li>
                    Maintain and update your information to keep it accurate
                  </li>
                  <li>Maintain the security of your password and account</li>
                  <li>
                    Accept responsibility for all activities under your account
                  </li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
              </div>
            </section>

            {/* Use of Services */}
            <section>
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="w-6 h-6 text-amber-400" />
                <h2 className="text-2xl font-bold text-amber-200">
                  3. Use of Services
                </h2>
              </div>
              <div className="text-amber-100/80 leading-relaxed space-y-3">
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon the rights of others</li>
                  <li>
                    Transmit any harmful code, viruses, or malicious software
                  </li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Use the platform for fraudulent purposes</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Scrape, copy, or duplicate content without permission</li>
                </ul>
              </div>
            </section>

            {/* Product Listings & Purchases */}
            <section>
              <h2 className="text-2xl font-bold text-amber-200 mb-4">
                4. Product Listings & Purchases
              </h2>
              <div className="text-amber-100/80 leading-relaxed space-y-3">
                <p>
                  All product descriptions, prices, and availability are subject
                  to change without notice. We reserve the right to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Limit quantities of products available for purchase</li>
                  <li>Refuse or cancel orders at our discretion</li>
                  <li>Verify payment information before processing orders</li>
                  <li>Correct pricing errors or inaccuracies</li>
                </ul>
              </div>
            </section>

            {/* Nile Miles Program */}
            <section>
              <h2 className="text-2xl font-bold text-amber-200 mb-4">
                5. Nile Miles Loyalty Program
              </h2>
              <div className="text-amber-100/80 leading-relaxed space-y-3">
                <p>
                  The Nile Miles loyalty program is subject to the following
                  terms:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Miles are earned on qualifying purchases only</li>
                  <li>Miles have no cash value and cannot be transferred</li>
                  <li>
                    We reserve the right to modify or terminate the program
                  </li>
                  <li>Fraudulent activity may result in forfeiture of miles</li>
                  <li>Rewards are subject to availability</li>
                </ul>
              </div>
            </section>

            {/* Payment & Pricing */}
            <section>
              <h2 className="text-2xl font-bold text-amber-200 mb-4">
                6. Payment & Pricing
              </h2>
              <p className="text-amber-100/80 leading-relaxed">
                All prices are listed in the currency displayed at checkout.
                Payment must be made in full before order processing. We accept
                various payment methods including credit cards, debit cards, and
                cash on delivery. You agree to provide valid payment information
                and authorize us to charge your selected payment method.
              </p>
            </section>

            {/* Shipping & Delivery */}
            <section>
              <h2 className="text-2xl font-bold text-amber-200 mb-4">
                7. Shipping & Delivery
              </h2>
              <p className="text-amber-100/80 leading-relaxed">
                Shipping times are estimates and may vary. We are not
                responsible for delays caused by shipping carriers or customs.
                Risk of loss transfers to you upon delivery. Please inspect your
                order upon receipt and report any issues within 48 hours.
              </p>
            </section>

            {/* Returns & Refunds */}
            <section>
              <h2 className="text-2xl font-bold text-amber-200 mb-4">
                8. Returns & Refunds
              </h2>
              <p className="text-amber-100/80 leading-relaxed">
                Our return policy allows returns within 30 days of delivery for
                most items. Products must be unused and in original packaging.
                Certain items may not be eligible for return. Refunds will be
                processed to the original payment method within 5-10 business
                days of receiving the returned item.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-amber-200 mb-4">
                9. Intellectual Property
              </h2>
              <p className="text-amber-100/80 leading-relaxed">
                All content on Nile Flow, including text, graphics, logos,
                images, and software, is the property of Nile Flow or its
                content suppliers and is protected by international copyright
                laws. You may not reproduce, distribute, or create derivative
                works without our express written permission.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-amber-200 mb-4">
                10. Limitation of Liability
              </h2>
              <p className="text-amber-100/80 leading-relaxed">
                Nile Flow shall not be liable for any indirect, incidental,
                special, or consequential damages arising from your use of our
                services. Our total liability shall not exceed the amount you
                paid for the specific product or service in question.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-amber-200 mb-4">
                11. Termination
              </h2>
              <p className="text-amber-100/80 leading-relaxed">
                We reserve the right to suspend or terminate your account at any
                time for violations of these terms, fraudulent activity, or any
                other reason at our sole discretion. Upon termination, your
                right to use the services will immediately cease.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold text-amber-200 mb-4">
                12. Changes to Terms
              </h2>
              <p className="text-amber-100/80 leading-relaxed">
                We may update these Terms of Service from time to time. We will
                notify you of any material changes by posting the new terms on
                this page and updating the "Last Updated" date. Your continued
                use of the platform after changes constitutes acceptance of the
                new terms.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-amber-200 mb-4">
                13. Contact Us
              </h2>
              <div className="text-amber-100/80 leading-relaxed space-y-2">
                <p>
                  If you have any questions about these Terms of Service, please
                  contact us:
                </p>
                <div className="bg-gradient-to-r from-amber-900/20 to-emerald-900/20 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4 mt-4">
                  <p>Email: legal@nileflowafrica.com</p>
                  <p>Phone: +254 XXX XXX XXX</p>
                  <p>Address: Kilimani, Nairobi, Kenya</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TermsOfService;
