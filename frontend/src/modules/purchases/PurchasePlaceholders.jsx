import React from 'react';
import { ShoppingBag, ChevronDown } from 'lucide-react';

const PlaceholderView = ({ title }) => (
    <div className="bg-white min-h-screen">
       <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
             <h1 className="text-[20px] font-bold text-slate-900">{title}</h1>
             <ChevronDown size={18} className="text-blue-600 mt-1" />
          </div>
       </div>
       <div className="p-20 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
             <ShoppingBag size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{title} Module</h2>
          <p className="text-slate-500">This module is coming soon to your Tally Replica ecosystem.</p>
       </div>
    </div>
);

export const RecurringExpensesView = () => <PlaceholderView title="Recurring Expenses" />;
export const RecurringBillsView = () => <PlaceholderView title="Recurring Bills" />;
export const PaymentsMadeView = () => <PlaceholderView title="Payments Made" />;
export const VendorCreditsView = () => <PlaceholderView title="Vendor Credits" />;
