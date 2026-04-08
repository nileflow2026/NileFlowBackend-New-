/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import {
  getVendorPayoutReconciliation,
  getPayoutAuditTrail,
  generatePayoutBatch,
  executePayoutBatch,
  completePayout,
  failPayout,
  calculateVendorPayouts,
  getPayoutSystemHealth,
  formatCurrency,
  formatDate,
  getPayoutStatusColor,
  getBatchStatusColor,
  validateBatchData,
  validateExecutionData
} from '../services/vendorPayoutService';

const VendorPayoutManagement = () => {
  // State management
  const [reconciliationData, setReconciliationData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [includeDetails, setIncludeDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState('');

  // Form states
  const [batchForm, setBatchForm] = useState({
    vendor_id: '',
    start_date: '',
    end_date: '',
    max_amount: '',
    description: ''
  });

  const [executionForm, setExecutionForm] = useState({
    batch_id: '',
    payment_method: 'MPESA',
    vendor_payment_details: {
      phone_number: '',
      account_number: '',
      bank_code: '',
      account_name: ''
    },
    external_reference: '',
    notes: ''
  });

  const [completionForm, setCompletionForm] = useState({
    payout_id: '',
    external_reference: '',
    notes: ''
  });

  // Load initial data
  useEffect(() => {
    loadReconciliationData();
    loadSystemHealth();
  }, [selectedPeriod, selectedVendorId, includeDetails]);

  const loadReconciliationData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        period: selectedPeriod,
        include_details: includeDetails
      };
      if (selectedVendorId) {
        params.vendor_id = selectedVendorId;
      }

      const data = await getVendorPayoutReconciliation(params);
      setReconciliationData(data.data);
    } catch (error) {
      console.error('Failed to load reconciliation data:', error);
      setError('Failed to load payout data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSystemHealth = async () => {
    try {
      const health = await getPayoutSystemHealth();
      setSystemHealth(health);
    } catch (error) {
      console.error('Failed to load system health:', error);
    }
  };

  const loadAuditTrail = async (entityId) => {
    if (!entityId) return;
    
    try {
      const trail = await getPayoutAuditTrail(entityId);
      setAuditTrail(trail.data || []);
    } catch (error) {
      console.error('Failed to load audit trail:', error);
      setError('Failed to load audit trail.');
    }
  };

  const handleGenerateBatch = async (e) => {
    e.preventDefault();
    
    const validation = validateBatchData(batchForm);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await generatePayoutBatch(batchForm);
      setSuccess(`Batch generated successfully: ${result.data.batch_id}`);
      setBatchForm({
        vendor_id: '',
        start_date: '',
        end_date: '',
        max_amount: '',
        description: ''
      });
      loadReconciliationData(); // Refresh data
    } catch (error) {
      console.error('Failed to generate batch:', error);
      setError(error.response?.data?.error || 'Failed to generate payout batch');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteBatch = async (e) => {
    e.preventDefault();
    
    const validation = validateExecutionData(executionForm);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await executePayoutBatch(executionForm);
      setSuccess(`Payout execution initiated: ${result.data.payout_id}`);
      setExecutionForm({
        batch_id: '',
        payment_method: 'MPESA',
        vendor_payment_details: {
          phone_number: '',
          account_number: '',
          bank_code: '',
          account_name: ''
        },
        external_reference: '',
        notes: ''
      });
      loadReconciliationData(); // Refresh data
    } catch (error) {
      console.error('Failed to execute batch:', error);
      setError(error.response?.data?.error || 'Failed to execute payout batch');
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePayout = async (e) => {
    e.preventDefault();
    
    if (!completionForm.payout_id) {
      setError('Payout ID is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await completePayout(completionForm);
      setSuccess('Payout completed successfully');
      setCompletionForm({
        payout_id: '',
        external_reference: '',
        notes: ''
      });
      loadReconciliationData(); // Refresh data
    } catch (error) {
      console.error('Failed to complete payout:', error);
      setError(error.response?.data?.error || 'Failed to complete payout');
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Payout Management</h1>
            <p className="text-gray-600 mt-1">CFO-grade vendor payout processing and reconciliation</p>
          </div>
          
          {/* System Health Indicator */}
          {systemHealth && (
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${
                systemHealth.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                System {systemHealth.status}
              </span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="current">Current Month</option>
              <option value="last-month">Last Month</option>
              <option value="2026-01">January 2026</option>
              <option value="2025-12">December 2025</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor ID</label>
            <input
              type="text"
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              placeholder="Filter by vendor ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeDetails}
                onChange={(e) => setIncludeDetails(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Include Details</span>
            </label>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadReconciliationData}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {(error || success) && (
        <div className={`rounded-lg p-4 ${error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          <div className="flex justify-between items-center">
            <p className={`${error ? 'text-red-700' : 'text-green-700'}`}>
              {error || success}
            </p>
            <button
              onClick={clearMessages}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['overview', 'generate-batch', 'execute-payout', 'complete-payout', 'audit-trail'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              {reconciliationData && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-800">Total Revenue</h3>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(reconciliationData.summary?.total_revenue || 0)}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-green-800">Total Payouts</h3>
                      <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(reconciliationData.summary?.total_vendor_payouts || 0)}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-yellow-800">Outstanding</h3>
                      <p className="text-2xl font-bold text-yellow-900">
                        {formatCurrency(reconciliationData.summary?.outstanding_payouts || 0)}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-purple-800">Commission</h3>
                      <p className="text-2xl font-bold text-purple-900">
                        {formatCurrency(reconciliationData.summary?.total_commission || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Recent Payouts */}
                  {reconciliationData.recent_payouts && reconciliationData.recent_payouts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payouts</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Payout ID
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Vendor
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {reconciliationData.recent_payouts.map((payout) => (
                              <tr key={payout.payout_id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                  {payout.payout_id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {payout.vendor_id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                  {formatCurrency(payout.amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPayoutStatusColor(payout.status)}`}>
                                    {payout.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(payout.created_at)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Generate Batch Tab */}
          {activeTab === 'generate-batch' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Payout Batch</h3>
              <form onSubmit={handleGenerateBatch} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={batchForm.vendor_id}
                    onChange={(e) => setBatchForm({ ...batchForm, vendor_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter vendor ID"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={batchForm.start_date}
                      onChange={(e) => setBatchForm({ ...batchForm, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={batchForm.end_date}
                      onChange={(e) => setBatchForm({ ...batchForm, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Amount (KES)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={batchForm.max_amount}
                    onChange={(e) => setBatchForm({ ...batchForm, max_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional: limit batch amount"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={batchForm.description}
                    onChange={(e) => setBatchForm({ ...batchForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Optional: batch description"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Generating...' : 'Generate Batch'}
                </button>
              </form>
            </div>
          )}

          {/* Execute Payout Tab */}
          {activeTab === 'execute-payout' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Execute Payout Batch</h3>
              <form onSubmit={handleExecuteBatch} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={executionForm.batch_id}
                    onChange={(e) => setExecutionForm({ ...executionForm, batch_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter batch ID to execute"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={executionForm.payment_method}
                    onChange={(e) => setExecutionForm({ ...executionForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MPESA">MPESA</option>
                    <option value="BANK">Bank Transfer</option>
                  </select>
                </div>
                
                {executionForm.payment_method === 'MPESA' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={executionForm.vendor_payment_details.phone_number}
                      onChange={(e) => setExecutionForm({
                        ...executionForm,
                        vendor_payment_details: {
                          ...executionForm.vendor_payment_details,
                          phone_number: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="254XXXXXXXXX"
                    />
                  </div>
                )}
                
                {executionForm.payment_method === 'BANK' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={executionForm.vendor_payment_details.account_number}
                        onChange={(e) => setExecutionForm({
                          ...executionForm,
                          vendor_payment_details: {
                            ...executionForm.vendor_payment_details,
                            account_number: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Bank account number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={executionForm.vendor_payment_details.bank_code}
                        onChange={(e) => setExecutionForm({
                          ...executionForm,
                          vendor_payment_details: {
                            ...executionForm.vendor_payment_details,
                            bank_code: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Bank code (e.g., 01 for KCB)"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                      <input
                        type="text"
                        value={executionForm.vendor_payment_details.account_name}
                        onChange={(e) => setExecutionForm({
                          ...executionForm,
                          vendor_payment_details: {
                            ...executionForm.vendor_payment_details,
                            account_name: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Account holder name"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">External Reference</label>
                  <input
                    type="text"
                    value={executionForm.external_reference}
                    onChange={(e) => setExecutionForm({ ...executionForm, external_reference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional: external transaction reference"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={executionForm.notes}
                    onChange={(e) => setExecutionForm({ ...executionForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Optional: execution notes"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Executing...' : 'Execute Payout'}
                </button>
              </form>
            </div>
          )}

          {/* Complete Payout Tab */}
          {activeTab === 'complete-payout' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Payout</h3>
              <form onSubmit={handleCompletePayout} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payout ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={completionForm.payout_id}
                    onChange={(e) => setCompletionForm({ ...completionForm, payout_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter payout ID to complete"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">External Reference</label>
                  <input
                    type="text"
                    value={completionForm.external_reference}
                    onChange={(e) => setCompletionForm({ ...completionForm, external_reference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Final transaction reference"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={completionForm.notes}
                    onChange={(e) => setCompletionForm({ ...completionForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Completion notes"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Completing...' : 'Complete Payout'}
                </button>
              </form>
            </div>
          )}

          {/* Audit Trail Tab */}
          {activeTab === 'audit-trail' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Trail</h3>
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={selectedEntity}
                    onChange={(e) => setSelectedEntity(e.target.value)}
                    placeholder="Enter batch ID, payout ID, or order ID"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => loadAuditTrail(selectedEntity)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Load Trail
                  </button>
                </div>
                
                {auditTrail.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Event
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Entity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Performed By
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {auditTrail.map((entry, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {entry.event_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                              {entry.entity_type}: {entry.entity_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {entry.performed_by}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(entry.timestamp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorPayoutManagement;