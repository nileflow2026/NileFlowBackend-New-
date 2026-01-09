import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
} from "react-router-dom";
import Home from "./Pages/Home";
import Shop from "./Pages/Shop";
import Deals from "./Pages/Deals";
import Contact from "./Pages/Contact";
import Language from "./Pages/Language";
import CategoryPage from "./Pages/CategoryPage";
import ProductDetailPage from "./Pages/ProductDetailPage";
import SearchScreen from "./Pages/Search";
import SignIn from "./Pages/SignIn";
import SignUp from "./Pages/Signup";
import { CartProvider } from "../components/CartContext";
import CartPage from "./Pages/CartPage";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ProfilePage from "./Pages/Profile";
import RedeemPage from "./Pages/Redeem";
import SettingsPage from "./Pages/Settings";
import OrdersPage from "./Pages/OrdersPage";
import AddressesPage from "./Pages/AddressesPage";
import ReturnPolicyPage from "./Pages/ReturnPolicyPage";
import CurrencyPage from "./Pages/CurrencyPage";
import HelpCenterPage from "./Pages/HelpCenter";
import ReportProblemPage from "./Pages/ReportProblemPage";
import AboutPage from "./Pages/AboutUsPage";
import NotificationsPage from "./Pages/NotificationPage";
import { NotificationProvider } from "../Context/NotificationContext";
import CheckoutPage from "./Pages/CheckoutPage";
import TrackOrder from "./Pages/TrackOrder";
import AllFeaturedProductsPage from "./Pages/AllFeaturedProductsPage";
import PaymentPage from "./Pages/PaymentPage";
import { CurrencyProvider } from "../Context/CurrencyProvider";
import Careers from "./Pages/Careers";
import ApplicationForm from "../components/ApplicationForm";
import PaymentSuccess from "./Pages/PaymentSuccess";
import Maintenance from "../components/Maintenance";
import DiscoverAfrica from "./Pages/DiscoverAfrica";
import AfricanChronicles from "./Pages/AfricanChronicles";
import CustomerAuthProvider, {
  useCustomerAuth,
} from "../Context/CustomerAuthContext";
import PaymentCancelled from "./Pages/PaymentCancelled";
import TermsOfService from "./Pages/TermsOfService";
import PrivacyPolicy from "./Pages/PrivacyPolicy";
import CancelOrderPage from "./Pages/CancelOrderPage";
import { PremiumProvider } from "../Context/PremiumContext";
import { FavoritesProvider } from "../Context/FavoritesContext.jsx";
import PremiumDealsPage from "./Pages/PremiumDealsPage";
import SubscriptionSuccess from "./Pages/SubscriptionSuccess";
import PickupAddressModal from "../components/PickupAddressModal";
import { savePickupAddress } from "../authServices";
import { useNavigate } from "react-router-dom";

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
  const { showPickupModal, setPickupModalVisible } = useCustomerAuth();

  const handlePickupAddressSubmit = async (addressData) => {
    try {
      const result = await savePickupAddress(addressData);

      if (result.success) {
        // Close modal
        setPickupModalVisible(false);

        // Show success message and redirect to home
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 500);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Failed to save pickup address:", error);
      throw error;
    }
  };

  const handleModalClose = () => {
    // Don't allow closing the modal - it's mandatory
    // setPickupModalVisible(false);
  };

  return (
    <>
      <div className="bg-black text-gray-800 font-sans min-h-screen relative">
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
      </div>

      {/* Global Pickup Address Modal */}
      <PickupAddressModal
        isOpen={showPickupModal}
        onClose={handleModalClose}
        onSubmit={handlePickupAddressSubmit}
      />
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
        <PremiumProvider>
          <FavoritesProvider>
            <NotificationProvider>
              <CurrencyProvider>
                <CartProvider>
                  <AppContent />
                </CartProvider>
              </CurrencyProvider>
            </NotificationProvider>
          </FavoritesProvider>
        </PremiumProvider>
      </CustomerAuthProvider>
    </Router>
  );
};

export default App;
