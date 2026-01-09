import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Plus,
  Trash2,
  ArrowLeft,
  Shield,
  Truck,
  Home,
  Building,
  Navigation,
  CheckCircle,
  Star,
  Sparkles,
  Globe,
  Edit2,
  Package,
  Clock,
  User,
} from "lucide-react";
import Modal from "react-modal"; // You'll need to install this: npm install react-modal
import { useCallback, useEffect, useState } from "react";
import Header from "../../components/Header";
import { fetchUserName } from "../../CustomerServices";
import AddressService from "../../utils/AddressService";
import { useCustomerAuth } from "../../Context/CustomerAuthContext";

Modal.setAppElement("#root");

const AddressesPage = () => {
  const { user, isAuthenticated, isLoading: userLoading } = useCustomerAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [username, setUserName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    addressType: "home",
  });

  const fetchAddresses = useCallback(async () => {
    if (!user || !user.id) return;
    try {
      setLoading(true);
      const fetchedAddresses = await AddressService.getAddresses(user.id);
      setAddresses(fetchedAddresses || []);
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!userLoading && user) {
      fetchAddresses();
    }
  }, [userLoading, user, isAuthenticated, fetchAddresses]);

  useEffect(() => {
    const fetchuserName = async () => {
      try {
        const user = await fetchUserName();
        setUserName(user.username);
        if (user.username) {
          setNewAddress((prev) => ({ ...prev, fullName: user.username }));
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchuserName();
  }, []);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!newAddress.phone || !newAddress.address) {
      alert("Missing Fields: Please fill in all required fields.");
      setSubmitting(false);
      return;
    }

    try {
      const addressData = {
        ...newAddress,
        fullName: username || user?.username || newAddress.fullName,
      };

      let result;
      if (editMode && selectedAddress) {
        result = await AddressService.updateAddress(
          selectedAddress.$id,
          addressData
        );
      } else {
        result = await AddressService.addAddress(user.userId, addressData);
      }

      if (result) {
        await fetchAddresses();
        resetForm();
        setModalVisible(false);
        setEditMode(false);
        setSelectedAddress(null);

        // Show success toast
        showToast(
          editMode
            ? "Address updated successfully!"
            : "Address added successfully!"
        );
      }
    } catch (error) {
      console.error("Error saving address:", error);
      showToast("Failed to save address. Please try again.", true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this address?"
    );
    if (confirmed) {
      const isDeleted = await AddressService.deleteAddress(id);
      if (isDeleted) {
        setAddresses(addresses.filter((item) => item.$id !== id));
        showToast("Address deleted successfully!");
      }
    }
  };

  const handleEditAddress = (address) => {
    setSelectedAddress(address);
    setNewAddress({
      fullName: address.fullName || user?.username || "",
      phone: address.phone || "",
      address: address.address || "",
      city: address.city || "",
      state: address.state || "",
      zipCode: address.zipCode || "",
      country: address.country || "",
      addressType: address.addressType || "home",
    });
    setEditMode(true);
    setModalVisible(true);
  };

  const resetForm = () => {
    setNewAddress({
      fullName: user?.username || "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      addressType: "home",
    });
  };

  const showToast = (message, isError = false) => {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 animate-fadeIn`;
    toast.innerHTML = `
      <div class="bg-gradient-to-r ${
        isError
          ? "from-red-900/80 to-amber-900/80"
          : "from-emerald-900/80 to-green-900/80"
      } backdrop-blur-sm border ${
      isError ? "border-red-700/50" : "border-emerald-700/50"
    } rounded-2xl p-4 shadow-2xl">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br ${
            isError
              ? "from-red-600 to-red-700"
              : "from-emerald-600 to-emerald-700"
          } flex items-center justify-center">
            ${
              isError
                ? '<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>'
                : '<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
            }
          </div>
          <div>
            <p class="font-bold text-white">${
              isError ? "Operation Failed" : "Success"
            }</p>
            <p class="${
              isError ? "text-red-100" : "text-emerald-100"
            } text-sm">${message}</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex justify-center items-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-10 h-10 text-amber-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center p-4">
        <Header />
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-red-900/30 to-amber-900/30 border border-red-700/30 mb-6">
            <Shield className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            Please log in to view and manage your premium delivery addresses.
          </p>
          <button
            onClick={() => navigate("/signin")}
            className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
          >
            <span>Go to Login</span>
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>
        </div>
      </div>
    );
  }

  const customModalStyles = {
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      backdropFilter: "blur(4px)",
      padding: "20px", // Add padding to prevent modal from touching screen edges
    },
    content: {
      position: "relative",
      top: "auto",
      left: "auto",
      right: "auto",
      bottom: "auto",
      margin: "auto", // Center the modal content
      background:
        "linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(0, 0, 0, 0.95))",
      backdropFilter: "blur(20px)",
      borderRadius: "24px",
      padding: "0",
      maxWidth: "600px",
      width: "100%",
      maxHeight: "90vh", // Prevent modal from being taller than viewport
      overflow: "auto", // Allow scrolling if content is too tall
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      border: "1px solid rgba(245, 158, 11, 0.2)",
      transform: "none", // Remove any transform that might interfere
    },
  };

  const addressTypes = [
    {
      value: "home",
      label: "Home",
      icon: <Home className="w-5 h-5" />,
      color: "from-amber-600 to-yellow-600",
    },
    {
      value: "work",
      label: "Work",
      icon: <Building className="w-5 h-5" />,
      color: "from-blue-600 to-indigo-600",
    },
    {
      value: "other",
      label: "Other",
      icon: <MapPin className="w-5 h-5" />,
      color: "from-emerald-600 to-green-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900/20 to-emerald-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <button
                onClick={() => navigate(-1)}
                className="group flex items-center space-x-2 text-amber-300 hover:text-amber-200 transition-colors mb-6"
              >
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back</span>
              </button>

              <div className="flex items-center space-x-3 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white">
                    Delivery Addresses
                  </h1>
                  <p className="text-gray-300 mt-2">
                    Manage your premium shipping destinations
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-6">
                <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-amber-700/30">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-200 text-sm">
                      Secure Storage
                    </span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-emerald-900/30 to-green-900/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-emerald-700/30">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-200 text-sm">
                      Fast Delivery
                    </span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-blue-700/30">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-200 text-sm">Africa Wide</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-4">
              <button
                onClick={() => {
                  resetForm();
                  setEditMode(false);
                  setSelectedAddress(null);
                  setModalVisible(true);
                }}
                className="group relative px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-2xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl"
              >
                <Plus className="w-6 h-6" />
                <span>Add New Address</span>
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </button>

              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  <span className="text-amber-300 font-bold">
                    {addresses.length}
                  </span>{" "}
                  saved addresses
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Addresses List */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {addresses.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-900/30 to-emerald-900/30 border border-amber-700/30 mb-6">
                <Navigation className="w-12 h-12 text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                No Addresses Found
              </h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8">
                Add your first delivery address to start ordering premium
                African products.
              </p>
              <button
                onClick={() => setModalVisible(true)}
                className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Address</span>
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {addresses.map((address) => {
                  const addressType = addressTypes.find(
                    (t) => t.value === (address.addressType || "home")
                  );

                  return (
                    <div
                      key={address.$id}
                      className="group relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6 hover:border-amber-500/50 transition-all duration-500 hover:-translate-y-2"
                    >
                      {/* Address Type Badge */}
                      <div className="absolute top-4 right-4">
                        <div
                          className={`bg-gradient-to-r ${addressType?.color} text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center space-x-1`}
                        >
                          {addressType?.icon}
                          <span>{addressType?.label}</span>
                        </div>
                      </div>

                      {/* Default Badge */}
                      {address.isDefault && (
                        <div className="absolute top-4 left-4">
                          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span>Default</span>
                          </div>
                        </div>
                      )}

                      {/* Address Content */}
                      <div className="pt-8">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-900/30 to-yellow-900/30 border border-amber-700/30 flex items-center justify-center">
                            <User className="w-6 h-6 text-amber-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {address.fullName}
                            </h3>
                            <p className="text-amber-400">{address.phone}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-start space-x-2">
                            <MapPin className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-gray-300">{address.address}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center space-x-2">
                              <Building className="w-4 h-4 text-blue-400" />
                              <span className="text-blue-300 text-sm">
                                {address.city}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Globe className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-300 text-sm">
                                {address.country || "Kenya"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-amber-800/30">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-400 text-xs">
                                Added recently
                              </span>
                            </div>

                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleEditAddress(address)}
                                className="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-900/20 rounded-lg transition-all duration-300"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(address.$id)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-300"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Hover Effect Line */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-emerald-500 group-hover:w-3/4 transition-all duration-500 rounded-full"></div>
                    </div>
                  );
                })}
              </div>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 text-center">
                  <div className="text-2xl font-bold text-amber-300 mb-2">
                    {addresses.length}
                  </div>
                  <div className="text-amber-100/80">Saved Addresses</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-6 text-center">
                  <div className="text-2xl font-bold text-emerald-300 mb-2">
                    24H
                  </div>
                  <div className="text-emerald-100/80">Delivery Window</div>
                </div>
                <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-6 text-center">
                  <div className="text-2xl font-bold text-blue-300 mb-2">
                    54
                  </div>
                  <div className="text-blue-100/80">African Countries</div>
                </div>
                <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-6 text-center">
                  <div className="text-2xl font-bold text-red-300 mb-2">
                    100%
                  </div>
                  <div className="text-red-100/80">Secure Storage</div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Add/Edit Address Modal */}
      <Modal
        isOpen={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setEditMode(false);
          setSelectedAddress(null);
          resetForm();
        }}
        style={customModalStyles}
        contentLabel="Add New Address"
        closeTimeoutMS={300}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                {editMode ? (
                  <Edit2 className="w-6 h-6 text-white" />
                ) : (
                  <Plus className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {editMode ? "Edit Address" : "Add New Address"}
                </h2>
                <p className="text-amber-100/70">Premium delivery details</p>
              </div>
            </div>
            <button
              onClick={() => {
                setModalVisible(false);
                setEditMode(false);
                setSelectedAddress(null);
                resetForm();
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleAddAddress} className="space-y-6">
            {/* Address Type Selection */}
            <div>
              <label className="block text-amber-100 font-medium mb-3">
                Address Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {addressTypes.map((type) => (
                  <button
                    type="button"
                    key={type.value}
                    onClick={() =>
                      setNewAddress({ ...newAddress, addressType: type.value })
                    }
                    className={`group relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 flex flex-col items-center justify-center space-y-2 ${
                      newAddress.addressType === type.value
                        ? `bg-gradient-to-r ${type.color} border-transparent text-white`
                        : "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 text-gray-300 hover:border-amber-500/50"
                    }`}
                  >
                    {newAddress.addressType === type.value && (
                      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-xl blur opacity-20"></div>
                    )}
                    <div
                      className={`${
                        newAddress.addressType === type.value
                          ? "text-white"
                          : "text-amber-400"
                      }`}
                    >
                      {type.icon}
                    </div>
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-amber-100 font-medium mb-2">
                  <span className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Full Name</span>
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Your full name"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors"
                  value={newAddress.fullName}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, fullName: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-amber-100 font-medium mb-2">
                  <span className="flex items-center space-x-2">
                    <Truck className="w-4 h-4" />
                    <span>Phone Number</span>
                  </span>
                </label>
                <input
                  type="tel"
                  placeholder="+254 XXX XXX XXX"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors"
                  value={newAddress.phone}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, phone: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-amber-100 font-medium mb-2">
                <span className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Street Address</span>
                </span>
              </label>
              <input
                type="text"
                placeholder="Building, street, area"
                className="w-full px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors"
                value={newAddress.address}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, address: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-amber-100 font-medium mb-2">
                  City
                </label>
                <input
                  type="text"
                  placeholder="City"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors"
                  value={newAddress.city}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, city: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-amber-100 font-medium mb-2">
                  State/Region
                </label>
                <input
                  type="text"
                  placeholder="State or Region"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors"
                  value={newAddress.state}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, state: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-amber-100 font-medium mb-2">
                  Zip/Postal Code
                </label>
                <input
                  type="text"
                  placeholder="Postal code"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors"
                  value={newAddress.zipCode}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, zipCode: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-amber-100 font-medium mb-2">
                  Country
                </label>
                <input
                  type="text"
                  placeholder="Country"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors"
                  value={newAddress.country}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, country: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-amber-800/30">
              <button
                type="button"
                onClick={() => {
                  setModalVisible(false);
                  setEditMode(false);
                  setSelectedAddress(null);
                  resetForm();
                }}
                className="px-6 py-3 bg-gradient-to-r from-gray-900/50 to-black/50 border border-amber-800/30 text-amber-300 rounded-xl hover:border-amber-500/50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="group relative px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {editMode ? (
                      <Edit2 className="w-5 h-5" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    <span>{editMode ? "Update Address" : "Add Address"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default AddressesPage;
