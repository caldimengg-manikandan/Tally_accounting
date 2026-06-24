import React from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api';

const UpgradeScreen = () => {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');

  const handleSubscribe = async (planId, price) => {
    try {
      // 1. Create Razorpay Order on Backend
      const response = await api.post('/subscription/create-order', { planId });
      if (!response.data.success) throw new Error('Failed to create order');

      const { order, key } = response.data;

      // 2. Initialize Razorpay Checkout
      const options = {
        key: key,
        amount: order.amount,
        currency: order.currency,
        name: "CallTally",
        description: "Subscription Upgrade",
        order_id: order.id,
        handler: function (response) {
          // 3. Payment Successful -> Let Webhook handle it, then redirect to Dashboard
          alert('Payment Successful! Welcome to the new tier.');
          window.location.href = '/dashboard';
        },
        theme: {
          color: "#3B82F6"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Subscription Error:', error);
      alert('Could not initiate payment. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {reason === 'PAYWALL_ACTIVE' && (
        <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded w-full max-w-4xl text-center">
          <strong>Your Trial has Expired.</strong> You are currently in Read-Only Mode. Please upgrade to continue creating records.
        </div>
      )}
      {reason === 'STUDENT_LIMIT' && (
        <div className="mb-8 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded w-full max-w-4xl text-center">
          <strong>Student Limit Reached.</strong> You have hit the maximum number of records allowed for Student accounts. Upgrade to Business to remove limits.
        </div>
      )}
      
      <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-10">Choose Your Plan</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {/* Basic Plan */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 flex flex-col">
          <div className="px-6 py-8">
            <h3 className="text-2xl font-bold text-gray-900 text-center">Basic Plan</h3>
            <p className="mt-4 text-gray-500 text-center text-sm">Perfect for small teams and basic accounting.</p>
            <p className="mt-8 text-center text-4xl font-extrabold text-gray-900">₹0 <span className="text-xl font-medium text-gray-500">/mo</span></p>
          </div>
          <div className="px-6 pt-6 pb-8 bg-gray-50 flex-1 flex flex-col justify-between">
            <ul className="space-y-4">
              <li className="flex items-start"><span className="text-green-500 mr-2">✓</span> Sales & Purchases</li>
              <li className="flex items-start"><span className="text-green-500 mr-2">✓</span> Standard Ledgers</li>
            </ul>
            <button disabled className="mt-8 block w-full bg-gray-300 text-gray-600 font-semibold py-3 px-4 rounded cursor-not-allowed">
              Current Plan
            </button>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="bg-blue-50 rounded-lg shadow-xl overflow-hidden border-2 border-blue-500 flex flex-col transform md:-translate-y-4">
          <div className="px-6 py-8">
            <h3 className="text-2xl font-bold text-blue-900 text-center">Pro Plan</h3>
            <p className="mt-4 text-blue-700 text-center text-sm">Most popular for growing businesses.</p>
            <p className="mt-8 text-center text-4xl font-extrabold text-blue-900">₹999 <span className="text-xl font-medium text-blue-700">/mo</span></p>
          </div>
          <div className="px-6 pt-6 pb-8 bg-white flex-1 flex flex-col justify-between">
            <ul className="space-y-4">
              <li className="flex items-start"><span className="text-green-500 mr-2">✓</span> Everything in Basic</li>
              <li className="flex items-start"><span className="text-green-500 mr-2">✓</span> Inventory Management</li>
              <li className="flex items-start"><span className="text-green-500 mr-2">✓</span> Multi-Currency</li>
              <li className="flex items-start"><span className="text-green-500 mr-2">✓</span> Cost Centers</li>
            </ul>
            <button 
              onClick={() => handleSubscribe('PRO_PLAN_ID_HERE', 999)}
              className="mt-8 block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded shadow transition-colors duration-200"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 flex flex-col">
          <div className="px-6 py-8">
            <h3 className="text-2xl font-bold text-gray-900 text-center">Enterprise</h3>
            <p className="mt-4 text-gray-500 text-center text-sm">For large organizations with complex needs.</p>
            <p className="mt-8 text-center text-4xl font-extrabold text-gray-900">₹4,999 <span className="text-xl font-medium text-gray-500">/mo</span></p>
          </div>
          <div className="px-6 pt-6 pb-8 bg-gray-50 flex-1 flex flex-col justify-between">
            <ul className="space-y-4">
              <li className="flex items-start"><span className="text-green-500 mr-2">✓</span> Everything in Pro</li>
              <li className="flex items-start"><span className="text-green-500 mr-2">✓</span> Multi-Branch / Location</li>
              <li className="flex items-start"><span className="text-green-500 mr-2">✓</span> Developer API Access</li>
              <li className="flex items-start"><span className="text-green-500 mr-2">✓</span> 24/7 Priority Support</li>
            </ul>
            <button 
              onClick={() => handleSubscribe('ENT_PLAN_ID_HERE', 4999)}
              className="mt-8 block w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded shadow transition-colors duration-200"
            >
              Upgrade to Enterprise
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeScreen;
