import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, ShieldCheck, Loader2, ArrowUpCircle, Receipt, X } from 'lucide-react';
import { subscriptionAPI, companyAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';

const FEATURE_DESCRIPTIONS = {
  SALES: 'Invoicing & Journal Entries',
  PURCHASES: 'Vendor Bill Management',
  LEDGERS: 'Standard Reports & Ledgers',
  INVENTORY: 'Inventory Tracking',
  MULTI_CURRENCY: 'Multi-Currency Support',
  COST_CENTERS: 'Cost Centers & Payroll',
  MULTI_BRANCH: 'Multi-Branch & Godowns',
  API_ACCESS: 'REST API & Third-party Integrations',
  PRIORITY_SUPPORT: 'Priority Support Access'
};

const PLAN_DESCRIPTIONS = {
  'Basic Plan': 'Essential accounting modules including Sales, Purchases, and standard Ledgers. Perfect for small businesses starting out.',
  'Pro Plan': 'Includes all Basic features, plus Inventory tracking, Multi-Currency, and Cost Centers. Great for growing teams.',
  'Enterprise Plan': 'All Pro features plus API Access, Multi-Branch/Godown support, and Priority Support. Designed for large scale operations.'
};

const SubscriptionSettings = ({ companyId }) => {
  const { addNotification } = useNotificationStore();
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    fetchSubscription();
  }, [companyId]);

  const fetchSubscription = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      // 1. Fetch available plans from backend database
      const plansRes = await subscriptionAPI.getPlans();
      const dbPlans = plansRes.data || [];
      
      const formattedPlans = dbPlans.map(p => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price),
        interval: 'month',
        features: Array.isArray(p.features) 
          ? p.features.map(f => FEATURE_DESCRIPTIONS[f] || f)
          : []
      }));
      setPlans(formattedPlans);

      // 2. Fetch company subscription details
      const res = await companyAPI.getById(companyId);
      const company = res.data;
      
      // Resolve plan
      const activePlan = formattedPlans.find(p => p.id === company.planId) || formattedPlans[0];
      
      setCurrentPlan({
        name: company.SubscriptionPlan?.name || activePlan?.name || 'Basic Plan',
        price: company.SubscriptionPlan?.price || activePlan?.price || 0,
        status: company.subscriptionStatus || 'Trial',
        trialEnds: company.trialEndsAt ? new Date(company.trialEndsAt).toLocaleDateString() : 'N/A',
        isActive: company.subscriptionStatus === 'Active'
      });

      // Parse billing history from company billing details
      if (company.BillingHistory) {
        setBillingHistory(company.BillingHistory);
      } else {
        // Mock standard billing logs if empty
        setBillingHistory([
          { id: 'bill_001', Plan: { name: company.SubscriptionPlan?.name || activePlan?.name || 'Basic Plan' }, amount: company.SubscriptionPlan?.price || activePlan?.price || 0, startDate: company.createdAt || new Date(), paymentStatus: 'Paid' }
        ]);
      }
    } catch (err) {
      console.error(err);
      addNotification('Failed to retrieve subscription status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan) => {
    setUpgradingPlan(plan.id);
    try {
      const resOrder = await subscriptionAPI.createOrder(plan.id);
      
      if (resOrder.data && resOrder.data.success) {
        const order = resOrder.data.order;
        addNotification(`Order ${order.id} generated. Simulating checkout payments...`, 'info');
        
        // Simulating the Razorpay Payment Gateway modal interaction
        setTimeout(async () => {
          try {
            await subscriptionAPI.mockSuccess(order.id);
            addNotification(`Payment of ₹${plan.price} processed successfully via Razorpay Mock!`, 'success');
            fetchSubscription();
          } catch (mockErr) {
            console.error(mockErr);
            addNotification('Mock payment confirmation failed', 'error');
          } finally {
            setUpgradingPlan(null);
          }
        }, 1500);
      } else {
        throw new Error('Failed to start transaction checkout order');
      }
    } catch (err) {
      console.error(err);
      addNotification(err.response?.data?.error || 'Upgrade failed. Please configure Payment Gateway.', 'error');
      setUpgradingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
        <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
        <span className="text-xs font-bold uppercase tracking-widest">Loading subscription plans...</span>
      </div>
    );
  }

  return (
    <div className="w-full box-border relative">
      <div className="print:hidden">
        <header className="mb-8 border-b border-slate-100 dark:border-slate-700 pb-5">
          <div className="flex items-center gap-2.5">
            <CreditCard className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Subscription & Billing</h1>
          </div>
          <p className="text-[12px] text-slate-400 mt-1">
            Review your current workspace subscription plan, pricing options, and complete billing payment receipts.
          </p>
        </header>

      {/* Current plan status card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Active Plan</div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{currentPlan?.name}</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
              ${currentPlan?.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {currentPlan?.status}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Trial period ends: <span className="font-semibold text-slate-600">{currentPlan?.trialEnds}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
          <ShieldCheck size={20} className="text-emerald-500" />
          <span className="text-xs text-slate-600">Enterprise Grade Encrypted Transactions</span>
        </div>
      </div>

      {/* Plans Comparison Grid */}
      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4">Choose Pricing Plan</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map(plan => {
          const isSelected = currentPlan?.name === plan.name;
          return (
            <div 
              key={plan.id}
              className={`bg-white border rounded-2xl p-6 flex flex-col justify-between shadow-sm transition-all duration-200
                ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{plan.name}</span>
                  {isSelected && (
                    <CheckCircle2 size={16} className="text-blue-500" />
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100">₹{plan.price}</span>
                  <span className="text-xs text-slate-400">/{plan.interval}</span>
                </div>
                
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed min-h-[50px]">
                  {PLAN_DESCRIPTIONS[plan.name] || 'Unlock additional modules and features to scale your business operations.'}
                </p>

                <ul className="space-y-2 pt-4 border-t border-slate-100">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[12px] text-slate-600">
                      <span className="text-emerald-500 font-bold mt-0.5">•</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 w-full">
                {isSelected ? (
                  <button 
                    disabled 
                    className="w-full h-10 bg-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider rounded-lg cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={upgradingPlan !== null}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    {upgradingPlan === plan.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ArrowUpCircle size={14} />
                    )}
                    Upgrade
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Billing history list */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
          Billing Payment History
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Bill Date</th>
                <th className="pb-3">Bill Item</th>
                <th className="pb-3">Amount Paid</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[13px]">
              {billingHistory.map((bill, idx) => (
                <tr key={idx} className="text-slate-700 hover:bg-slate-50/50">
                  <td className="py-3.5 font-medium">
                    {new Date(bill.startDate || bill.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5">{bill.Plan?.name || 'Basic Plan Upgrade'}</td>
                  <td className="py-3.5 font-bold text-slate-800 dark:text-slate-100">₹{bill.amount}</td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase tracking-wider">
                      {bill.paymentStatus || 'Paid'}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <button 
                      onClick={() => setSelectedReceipt(bill)}
                      className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
                    >
                      <Receipt size={14} /> View Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div> {/* End print:hidden wrapper */}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print:absolute print:inset-0 print:bg-white print:w-full print:min-h-screen print:z-[99999] print:block print:p-0">
          
          {/* SCREEN UI (Hidden on Print) */}
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 print:hidden">
            <div className="bg-slate-50 border-b border-slate-100 dark:border-slate-700 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Payment Receipt</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Transaction ID: TXN-{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
              </div>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-700 pb-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Your Workspace</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Date: {new Date(selectedReceipt.startDate || selectedReceipt.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Amount Paid</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100">₹{selectedReceipt.amount}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase tracking-wider">
                    {selectedReceipt.paymentStatus || 'Paid'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Item Details</p>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedReceipt.Plan?.name || 'Basic Plan Upgrade'}</h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {PLAN_DESCRIPTIONS[selectedReceipt.Plan?.name || 'Basic Plan'] || 'Subscription renewal.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => {
                  window.print();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Receipt size={14} /> Print / Save PDF
              </button>
            </div>
          </div>

          {/* PRINT UI (Hidden on Screen) */}
          <div className="hidden print:block w-full max-w-4xl mx-auto p-12 bg-white text-slate-800 dark:text-slate-100">
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-8 mb-8">
              <div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">RECEIPT</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Transaction ID: TXN-{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">CalTally Solutions</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">contact@caltally.com</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">www.caltally.com</p>
              </div>
            </div>

            <div className="flex justify-between items-start mb-12">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{sessionStorage.getItem('companyName') || 'Your Workspace'}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Subscription Plan Renewal</p>
              </div>
              <div className="text-right">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date of Issue</h3>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{new Date(selectedReceipt.startDate || selectedReceipt.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <table className="w-full text-left mb-12 border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800">
                  <th className="py-4 text-sm font-bold text-slate-800 dark:text-slate-100 uppercase">Description</th>
                  <th className="py-4 text-sm font-bold text-slate-800 dark:text-slate-100 uppercase text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-6">
                    <p className="font-bold text-slate-800 dark:text-slate-100">{selectedReceipt.Plan?.name || 'Basic Plan'}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-md">{PLAN_DESCRIPTIONS[selectedReceipt.Plan?.name || 'Basic Plan'] || 'Subscription renewal.'}</p>
                  </td>
                  <td className="py-6 text-right font-bold text-slate-800 dark:text-slate-100 align-top">
                    ₹{selectedReceipt.amount}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-72">
                <div className="flex justify-between py-3 border-b border-slate-200">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Subtotal</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">₹{selectedReceipt.amount}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-800">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Tax (0%)</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">₹0</span>
                </div>
                <div className="flex justify-between py-4">
                  <span className="text-lg font-black text-slate-800 dark:text-slate-100">Total Paid</span>
                  <span className="text-lg font-black text-emerald-600">₹{selectedReceipt.amount}</span>
                </div>
              </div>
            </div>

            <div className="mt-24 pt-8 border-t border-slate-200 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thank you for your business</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionSettings;
