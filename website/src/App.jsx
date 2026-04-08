/* eslint-disable no-unused-vars */
import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
} from "react-router-dom";

// Lazy load all page components for code splitting
const Home = lazy(() => import("./Pages/Home"));
const Shop = lazy(() => import("./Pages/Shop"));
const Deals = lazy(() => import("./Pages/Deals"));
const Contact = lazy(() => import("./Pages/Contact"));
const Language = lazy(() => import("./Pages/Language"));
const CategoryPage = lazy(() => import("./Pages/CategoryPage"));
// Don't lazy load ProductDetailPage to avoid Router context issues
import ProductDetailPage from "./Pages/ProductDetailPage";
const SearchScreen = lazy(() => import("./Pages/Search"));
const SignIn = lazy(() => import("./Pages/SignIn"));
const SignUp = lazy(() => import("./Pages/Signup"));
const ForgotPassword = lazy(() => import("./Pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./Pages/ResetPassword"));
const CartPage = lazy(() => import("./Pages/CartPage"));
const ProfilePage = lazy(() => import("./Pages/Profile"));
const RedeemPage = lazy(() => import("./Pages/Redeem"));
const SettingsPage = lazy(() => import("./Pages/Settings"));
const OrdersPage = lazy(() => import("./Pages/OrdersPage"));
const AddressesPage = lazy(() => import("./Pages/AddressesPage"));
const ReturnPolicyPage = lazy(() => import("./Pages/ReturnPolicyPage"));
const CurrencyPage = lazy(() => import("./Pages/CurrencyPage"));
const HelpCenterPage = lazy(() => import("./Pages/HelpCenter"));
const ReportProblemPage = lazy(() => import("./Pages/ReportProblemPage"));
const AboutPage = lazy(() => import("./Pages/AboutUsPage"));
const NotificationsPage = lazy(() => import("./Pages/NotificationPage"));
const CheckoutPage = lazy(() => import("./Pages/CheckoutPage"));
const TrackOrder = lazy(() => import("./Pages/TrackOrder"));
const TrackOrderPage = lazy(() => import("./Pages/TrackOrderPage"));
const AllFeaturedProductsPage = lazy(
  () => import("./Pages/AllFeaturedProductsPage"),
);
const PaymentPage = lazy(() => import("./Pages/PaymentPage"));
const Careers = lazy(() => import("./Pages/Careers"));
const PaymentSuccess = lazy(() => import("./Pages/PaymentSuccess"));
const DiscoverAfrica = lazy(() => import("./Pages/DiscoverAfrica"));
const AfricanChronicles = lazy(() => import("./Pages/AfricanChronicles"));
const PaymentCancelled = lazy(() => import("./Pages/PaymentCancelled"));
const TermsOfService = lazy(() => import("./Pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./Pages/PrivacyPolicy"));
const CancelOrderPage = lazy(() => import("./Pages/CancelOrderPage"));
const PremiumDealsPage = lazy(() => import("./Pages/PremiumDealsPage"));
const SubscriptionSuccess = lazy(() => import("./Pages/SubscriptionSuccess"));

// Lazy load heavy components
const ApplicationForm = lazy(() => import("../components/ApplicationForm"));

// Keep essential components synchronous
import { CartProvider } from "../components/CartContext";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { NotificationProvider } from "../Context/NotificationContext";
import Maintenance from "../components/Maintenance";
import CustomerAuthProvider, {
  useCustomerAuth,
} from "../Context/CustomerAuthContext";
import { PremiumProvider } from "../Context/PremiumContext";
import { FavoritesProvider } from "../Context/FavoritesContext.jsx";
import { CurrencyProvider } from "../Context/CurrencyProvider";
import { useNavigate } from "react-router-dom";
import ScrollToTopButton from "../components/ScrollToTopButton.jsx";
import NotificationToast from "../components/NotificationToast";

// Loading component for lazy routes
const PageLoader = () => (
  <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-[9990]">
    <div className="flex flex-col items-center space-y-6">
      {/* Main Spinner */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-amber-900/30 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full absolute top-0 left-0 animate-spin"></div>
        <div
          className="w-12 h-12 border-3 border-emerald-500/50 border-t-transparent rounded-full absolute top-2 left-2 animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        ></div>
      </div>

      {/* Loading Text */}
      <div className="text-center">
        <p className="text-amber-100 text-lg font-medium mb-2">Loading...</p>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
          <div
            className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>

      {/* Nile Flow Branding */}
      <div className="text-center">
        <p className="text-amber-300/70 text-sm font-serif">NILE FLOW AFRICA</p>
        <p className="text-amber-100/50 text-xs">Premium African E-commerce</p>
      </div>
    </div>
  </div>
);

// Wrapper component to extract orderId from route params
const TrackOrderWrapper = () => {
  const { id } = useParams();
  const { user } = useCustomerAuth();

  return (
    <TrackOrder
      orderId={id}
      userId={user?.id || user?.$id}
      estimatedDelivery="2-3 business days"
      orderTime={new Date().toLocaleDateString()}
    />
  );
};

// Separate component to use auth hooks
const AppContent = () => {
  const navigate = useNavigate();
  // Removed pickup modal logic - only handled at checkout now

  return (
    <>
      <div className="bg-black text-gray-800 font-sans min-h-screen relative">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/language" element={<Language />} />
            <Route path="/categories" element={<CategoryPage />} />
            <Route path="/categories/:categoryId" element={<CategoryPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/search" element={<SearchScreen />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/redeem" element={<RedeemPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/cancel-order" element={<CancelOrderPage />} />
            <Route path="/addresses" element={<AddressesPage />} />
            <Route path="/return-policy" element={<ReturnPolicyPage />} />
            <Route path="/currency" element={<CurrencyPage />} />
            <Route path="/help-center" element={<HelpCenterPage />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancelled" element={<PaymentCancelled />} />
            <Route path="/report-issue" element={<ReportProblemPage />} />
            <Route path="/about-us" element={<AboutPage />} />
            <Route path="/notification" element={<NotificationsPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/track-order" element={<TrackOrderPage />} />
            <Route path="/track-order/:id" element={<TrackOrderWrapper />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/apply/:jobId" element={<ApplicationForm />} />
            <Route path="/discover" element={<DiscoverAfrica />} />
            <Route path="/african-chronicles" element={<AfricanChronicles />} />
            <Route
              path="/featured-products"
              element={<AllFeaturedProductsPage />}
            />
            <Route path="/premium-deals" element={<PremiumDealsPage />} />
            <Route
              path="/subscription/success"
              element={<SubscriptionSuccess />}
            />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            {/* Add more routes here */}
          </Routes>
        </Suspense>
      </div>

      {/* Global Notification Components */}
      <NotificationToast />

      {/* Scroll to top button */}
      <ScrollToTopButton />

      {/* Pickup address modal removed - only shows at checkout now */}
    </>
  );
};

const App = () => {
  const APP_IS_DOWN = false; // Flip to false when Appwrite is back

  if (APP_IS_DOWN) {
    return <Maintenance />;
  }

  /*  localStorage.clear(); // Clear localStorage on app start */
  return (
    <Router>
      <CustomerAuthProvider>
        <CurrencyProvider>
          <PremiumProvider>
            <FavoritesProvider>
              <NotificationProvider>
                <CartProvider>
                  <AppContent />
                </CartProvider>
              </NotificationProvider>
            </FavoritesProvider>
          </PremiumProvider>
        </CurrencyProvider>
      </CustomerAuthProvider>
    </Router>
  );
};

export default App;
