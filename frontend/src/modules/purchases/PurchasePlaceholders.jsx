import React from 'react';
import { ShoppingBag, ChevronDown, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PlaceholderView = ({ title, newPath }) => {
    const navigate = useNavigate();
    return (
        <div className="bg-white min-h-screen">
           <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                 <h1 className="text-[20px] font-bold text-slate-900">{title}</h1>
                 <ChevronDown size={18} className="text-blue-600 mt-1" />
              </div>
              {newPath && (
                  <button 
                    onClick={() => navigate(newPath)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors text-[13px]"
                  >
                      <Plus size={16} />
                      New
                  </button>
              )}
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
};

export const RecurringExpensesView = () => <PlaceholderView title="Recurring Expenses" newPath="/recurring-expenses/new" />;
export const PaymentsMadeView = () => <PlaceholderView title="Payments Made" newPath="/payments-made/new" />;
