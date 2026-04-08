import React from 'react';
import { Repeat, PlusCircle } from 'lucide-react';

const RecurringInvoicesView = () => (
    <div className="flex flex-col items-center justify-center p-20 text-center animate-fade-up">
        <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center text-purple-500 mb-8">
            <Repeat size={48}/>
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">Recurring Invoices</h3>
        <p className="text-slate-400 font-medium max-w-md mx-auto mb-8">Automate your billing for subscription-based services or regular maintenance work.</p>
        <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-lg flex items-center gap-2 hover:bg-slate-800 transition-colors">
            <PlusCircle size={18}/> Setup Recurring Invoice
        </button>
    </div>
);

export default RecurringInvoicesView;
