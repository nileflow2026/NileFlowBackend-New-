import React from "react";
import Header from "../../components/Header";
import {
  Shield,
  RefreshCw,
  Package,
  Clock,
  DollarSign,
  Truck,
  Headphones,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Award,
  Leaf,
} from "lucide-react";
import Footer from "../../components/Footer";

const ReturnPolicyPage = () => {
  const policySections = [
    {
      title: "Eligibility for Returns",
      icon: <Shield className="w-8 h-8" />,
      color: "from-amber-600 to-amber-700",
      items: [
        "Items must be returned within 30 days of the delivery date.",
        "Items must be unused, undamaged, and in their original packaging.",
        "Proof of purchase is required for all returns.",
        "Custom or personalized items may not be returned unless defective.",
        'Items marked as "final sale" are not eligible for return.',
      ],
      note: "Your satisfaction is our priority",
    },
    {
      title: "How to Initiate a Return",
      icon: <RefreshCw className="w-8 h-8" />,
      color: "from-emerald-600 to-emerald-700",
      steps: [
        "Contact our premium customer service team with your order number.",
        "We will provide you with a prepaid return shipping label.",
        "Pack the item securely with all original accessories.",
        "Ship the item back using our designated courier service.",
        "Track your return through our mobile app or website.",
      ],
    },
    {
      title: "Refunds",
      icon: <DollarSign className="w-8 h-8" />,
      color: "from-blue-600 to-blue-700",
      items: [
        "Refunds processed within 24 hours of receiving the returned item.",
        "Refunds issued to the original payment method within 3-5 business days.",
        "Shipping charges are non-refundable unless the return is due to our error.",
        "Digital gift cards are non-refundable.",
        "Partial refunds may be issued for items not returned in original condition.",
      ],
    },
    {
      title: "Exchanges",
      icon: <Package className="w-8 h-8" />,
      color: "from-purple-600 to-purple-700",
      items: [
        "Exchanges processed within 48 hours of receiving the returned item.",
        "Free return shipping for exchange requests within Africa.",
        "Price differences will be charged or refunded accordingly.",
        "Exchanges subject to product availability in your region.",
        "Priority shipping for exchange orders.",
      ],
    },
  ];

  const benefits = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "30-Day Window",
      description: "Ample time to decide",
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Free Returns",
      description: "Across Africa",
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: "Premium Support",
      description: "24/7 assistance",
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Hassle-Free",
      description: "Simple process",
    },
  ];

  return (
    <>
      <Header />

      {/* Hero Section */}
      <div className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900/20 to-emerald-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Premium Assurance
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
              Return Policy
            </span>
            <br />
            <span className="text-white">Premium African Standards</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            We stand behind every authentic African product we sell. Our premium
            return policy ensures your complete satisfaction and peace of mind.
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4 text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 mb-3">
                  {benefit.icon}
                </div>
                <div className="font-bold text-amber-300 mb-1">
                  {benefit.title}
                </div>
                <div className="text-amber-100/80 text-sm">
                  {benefit.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {/* Policy Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {policySections.map((section, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden"
              >
                {/* Section Header */}
                <div className={`bg-gradient-to-r ${section.color} p-6`}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      {section.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      {section.title}
                    </h2>
                  </div>
                </div>

                {/* Section Content */}
                <div className="p-6">
                  {section.steps ? (
                    <ol className="space-y-4">
                      {section.steps.map((step, stepIndex) => (
                        <li
                          key={stepIndex}
                          className="flex items-start space-x-3"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border border-amber-700/30 flex items-center justify-center">
                            <span className="text-amber-300 font-bold">
                              {stepIndex + 1}
                            </span>
                          </div>
                          <p className="text-gray-300 leading-relaxed">
                            {step}
                          </p>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <ul className="space-y-3">
                      {section.items.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="flex items-start space-x-3"
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center mt-1">
                            <Leaf className="w-3 h-3 text-white" />
                          </div>
                          <p className="text-gray-300 leading-relaxed">
                            {item}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.note && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-amber-900/20 to-yellow-900/20 backdrop-blur-sm border border-amber-700/30 rounded-xl">
                      <p className="text-amber-200 text-center font-medium">
                        {section.note}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Information */}
          <div className="mb-16">
            <div className="bg-gradient-to-r from-amber-900/20 to-emerald-900/20 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Premium African Quality Guarantee
                    </h3>
                    <p className="text-amber-100/70">
                      Every product meets our stringent quality standards
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-300">98%</div>
                    <div className="text-amber-100/80 text-sm">
                      Satisfaction Rate
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-300">
                      24H
                    </div>
                    <div className="text-emerald-100/80 text-sm">
                      Response Time
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-amber-200 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  q: "How long does it take to process a refund?",
                  a: "Refunds are typically processed within 24 hours of receiving the returned item, and appear in your account within 3-5 business days.",
                },
                {
                  q: "Do you offer free return shipping?",
                  a: "Yes, we offer free return shipping across Africa for all eligible returns.",
                },
                {
                  q: "Can I exchange for a different size or color?",
                  a: "Absolutely! We facilitate size and color exchanges at no additional cost within Africa.",
                },
                {
                  q: "What if my item arrives damaged?",
                  a: "Contact us immediately within 48 hours of delivery. We'll arrange a replacement or refund at no cost to you.",
                },
              ].map((faq, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6"
                >
                  <h4 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white text-sm">
                      Q
                    </span>
                    <span>{faq.q}</span>
                  </h4>
                  <p className="text-gray-300 pl-8">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="inline-block bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8 max-w-2xl">
              <h3 className="text-2xl font-bold text-white mb-4">
                Need Help With a Return?
              </h3>
              <p className="text-gray-300 mb-6">
                Our premium customer support team is here to assist you 24/7
                with any return or exchange inquiries.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="group px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 flex items-center justify-center space-x-2">
                  <span>Start a Return</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-3 border-2 border-amber-500/50 text-amber-400 font-bold rounded-xl hover:bg-amber-500/10 transition-all duration-300">
                  Contact Support
                </button>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 text-center">
              <div className="text-2xl font-bold text-amber-300 mb-2">
                30 Days
              </div>
              <div className="text-amber-100/80">Return Window</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-6 text-center">
              <div className="text-2xl font-bold text-emerald-300 mb-2">
                Free
              </div>
              <div className="text-emerald-100/80">African Returns</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-6 text-center">
              <div className="text-2xl font-bold text-blue-300 mb-2">
                24 Hours
              </div>
              <div className="text-blue-100/80">Refund Processing</div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-6 text-center">
              <div className="text-2xl font-bold text-red-300 mb-2">100%</div>
              <div className="text-red-100/80">Satisfaction Guarantee</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ReturnPolicyPage;
