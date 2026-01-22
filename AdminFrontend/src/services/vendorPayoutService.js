// services/vendorPayoutService.js

import axiosClient from "../../api";

/**
 * Vendor Payout Service
 * 
 * Handles all vendor payout-related API calls for the admin frontend.
 * Provides CFO-grade financial management with comprehensive audit trails.
 */

/**
 * Get vendor payout reconciliation report (main CFO endpoint)
 * @param {Object} params - Filter parameters
 * @param {string} params.period - YYYY-MM, "current", or "last-month"
 * @param {string} params.vendor_id - Filter by vendor (optional)
 * @param {boolean} params.include_details - Include order details
 * @returns {Promise} Reconciliation report
 */
export const getVendorPayoutReconciliation = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.period) queryParams.append('period', params.period);
    if (params.vendor_id) queryParams.append('vendor_id', params.vendor_id);
    if (params.include_details) queryParams.append('include_details', 'true');
    
    const response = await axiosClient.get(
      `/api/admin/finance/vendor-payouts?${queryParams}`
    );
    return response.data;
  } catch (error) {
    console.error("[VendorPayout] getReconciliation error:", error);
    throw error;
  }
};

/**
 * Get audit trail for a payout entity
 * @param {string} entity_id - batch_id, payout_id, or order_id
 * @param {number} limit - Max entries to return (default: 100)
 * @returns {Promise} Audit trail data
 */
export const getPayoutAuditTrail = async (entity_id, limit = 100) => {
  try {
    const response = await axiosClient.get(
      `/api/admin/finance/vendor-payouts/audit/${entity_id}?limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("[VendorPayout] getAuditTrail error:", error);
    throw error;
  }
};

/**
 * Calculate vendor payouts for completed orders
 * @param {Object} data - Calculation parameters
 * @param {string[]} data.order_ids - Array of order IDs
 * @param {boolean} data.force_recalculation - Force recalculation
 * @returns {Promise} Calculation results
 */
export const calculateVendorPayouts = async (data) => {
  try {
    const response = await axiosClient.post(
      '/api/admin/finance/vendor-payouts/calculate',
      data
    );
    return response.data;
  } catch (error) {
    console.error("[VendorPayout] calculatePayouts error:", error);
    throw error;
  }
};

/**
 * Generate payout batch for a vendor
 * @param {Object} data - Batch generation parameters
 * @param {string} data.vendor_id - Vendor ID (required)
 * @param {string} data.start_date - Filter orders from date (optional)
 * @param {string} data.end_date - Filter orders to date (optional)
 * @param {number} data.max_amount - Maximum payout amount (optional)
 * @param {string} data.description - Batch description (optional)
 * @returns {Promise} Generated batch data
 */
export const generatePayoutBatch = async (data) => {
  try {
    const response = await axiosClient.post(
      '/api/admin/finance/vendor-payouts/generate-batch',
      data
    );
    return response.data;
  } catch (error) {
    console.error("[VendorPayout] generateBatch error:", error);
    throw error;
  }
};

/**
 * Execute payout batch (initiate external payment)
 * @param {Object} data - Execution parameters
 * @param {string} data.batch_id - Batch ID to execute (required)
 * @param {string} data.payment_method - "MPESA" or "BANK" (required)
 * @param {Object} data.vendor_payment_details - Payment details (required)
 * @param {string} data.external_reference - Transaction reference (optional)
 * @param {string} data.notes - Execution notes (optional)
 * @returns {Promise} Execution result
 */
export const executePayoutBatch = async (data) => {
  try {
    const response = await axiosClient.post(
      '/api/admin/finance/vendor-payouts/execute-batch',
      data
    );
    return response.data;
  } catch (error) {
    console.error("[VendorPayout] executeBatch error:", error);
    throw error;
  }
};

/**
 * Complete payout after successful external payment
 * @param {Object} data - Completion parameters
 * @param {string} data.payout_id - Payout ID to complete (required)
 * @param {string} data.external_reference - Final transaction reference (optional)
 * @param {string} data.notes - Completion notes (optional)
 * @returns {Promise} Completion result
 */
export const completePayout = async (data) => {
  try {
    const response = await axiosClient.post(
      '/api/admin/finance/vendor-payouts/complete-payout',
      data
    );
    return response.data;
  } catch (error) {
    console.error("[VendorPayout] completePayout error:", error);
    throw error;
  }
};

/**
 * Fail payout if external payment fails
 * @param {Object} data - Failure parameters
 * @param {string} data.payout_id - Payout ID to fail (required)
 * @param {string} data.failure_reason - Reason for failure (required)
 * @param {boolean} data.retry_possible - Whether retry is possible (optional)
 * @returns {Promise} Failure result
 */
export const failPayout = async (data) => {
  try {
    const response = await axiosClient.post(
      '/api/admin/finance/vendor-payouts/fail-payout',
      data
    );
    return response.data;
  } catch (error) {
    console.error("[VendorPayout] failPayout error:", error);
    throw error;
  }
};

/**
 * Get payout system health status
 * @returns {Promise} System health data
 */
export const getPayoutSystemHealth = async () => {
  try {
    const response = await axiosClient.get(
      '/api/admin/finance/vendor-payouts/health'
    );
    return response.data;
  } catch (error) {
    console.error("[VendorPayout] getSystemHealth error:", error);
    throw error;
  }
};

/**
 * Format currency for display (KES)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'KES 0.00';
  return `KES ${parseFloat(amount).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get payout status badge color
 * @param {string} status - Payout status
 * @returns {string} CSS color class
 */
export const getPayoutStatusColor = (status) => {
  const colors = {
    'PENDING': 'text-yellow-600 bg-yellow-100',
    'PROCESSING': 'text-blue-600 bg-blue-100', 
    'SUCCESS': 'text-green-600 bg-green-100',
    'FAILED': 'text-red-600 bg-red-100',
    'CANCELLED': 'text-gray-600 bg-gray-100'
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
};

/**
 * Get batch status badge color
 * @param {string} status - Batch status
 * @returns {string} CSS color class
 */
export const getBatchStatusColor = (status) => {
  const colors = {
    'DRAFT': 'text-gray-600 bg-gray-100',
    'PENDING': 'text-yellow-600 bg-yellow-100',
    'PROCESSING': 'text-blue-600 bg-blue-100',
    'COMPLETED': 'text-green-600 bg-green-100',
    'FAILED': 'text-red-600 bg-red-100',
    'CANCELLED': 'text-gray-600 bg-gray-100'
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
};

/**
 * Validate payout batch data
 * @param {Object} data - Batch data to validate
 * @returns {Object} Validation result
 */
export const validateBatchData = (data) => {
  const errors = [];
  
  if (!data.vendor_id) {
    errors.push('Vendor ID is required');
  }
  
  if (data.max_amount && data.max_amount <= 0) {
    errors.push('Maximum amount must be positive');
  }
  
  if (data.start_date && data.end_date && 
      new Date(data.start_date) > new Date(data.end_date)) {
    errors.push('Start date must be before end date');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate payment execution data
 * @param {Object} data - Execution data to validate
 * @returns {Object} Validation result
 */
export const validateExecutionData = (data) => {
  const errors = [];
  
  if (!data.batch_id) {
    errors.push('Batch ID is required');
  }
  
  if (!data.payment_method) {
    errors.push('Payment method is required');
  }
  
  if (!['MPESA', 'BANK'].includes(data.payment_method)) {
    errors.push('Payment method must be MPESA or BANK');
  }
  
  if (!data.vendor_payment_details) {
    errors.push('Vendor payment details are required');
  }
  
  if (data.payment_method === 'MPESA' && 
      !data.vendor_payment_details.phone_number) {
    errors.push('Phone number required for MPESA payments');
  }
  
  if (data.payment_method === 'BANK' && 
      (!data.vendor_payment_details.account_number || 
       !data.vendor_payment_details.bank_code)) {
    errors.push('Account number and bank code required for bank transfers');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};