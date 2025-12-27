import Head from "next/head";
import { useRouter } from "next/router";

const ThankYouPage = () => {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Thank You - Nile Flow</title>
        <meta
          name="description"
          content="Thank you for rating your delivery experience"
        />
      </Head>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Success Icon */}
            <div className="text-6xl mb-4">🎉</div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Thank You for Your Feedback!
            </h1>

            <p className="text-gray-600 mb-6">
              Your rating has been submitted successfully. Your feedback helps
              us improve our service and recognize our best riders.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => router.push("/")}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 transition-colors font-medium"
              >
                Continue Shopping
              </button>

              <button
                onClick={() => router.push("/orders")}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 transition-colors font-medium"
              >
                View My Orders
              </button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-sm text-gray-500">
            <p className="mb-2">🌟 Your rating matters to us!</p>
            <p>
              Our riders work hard to provide excellent service, and your
              feedback helps us maintain high standards.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ThankYouPage;
