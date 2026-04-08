import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit, Trash, MoreHorizontal } from 'lucide-react';
import { ledgerAPI } from '../../services/api';

const CustomerDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        // Technically vouchers/detail gets ledger details? Or we can just use the ledger APIs if there is a getById.
        // Assuming there isn't one immediately exposed perfectly for this, we can list all and find, or just show a nice placeholder.
        // Let's see if ledgerAPI has getById. If not, we'll gracefully fallback.
        const res = await ledgerAPI.getByCompany(localStorage.getItem('companyId'));
        const found = res.data.find(c => c.id === id || c.id === parseInt(id));
        if (found) {
          setCustomer(found);
        }
      } catch (err) {
        console.error("Failed to fetch customer", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-slate-500">Loading customer profile...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-slate-500">Customer not found.</div>;
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/customers')} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[20px] font-bold text-slate-900">{customer.name}</h1>
            <span className="text-[12px] text-slate-500 font-medium tracking-wide uppercase">{customer.customerType || 'Business'} Customer</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors">
            <Edit size={16} />
          </button>
          <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-md transition-colors">
            <Trash size={16} />
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-md">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Placeholder */}
      <div className="p-8 flex gap-8">
        <div className="w-1/3 bg-slate-50/50 border border-slate-100 rounded-xl p-6">
          <h3 className="text-[14px] font-bold text-slate-800 tracking-tight mb-4">Contact Details</h3>
          <div className="space-y-4 text-[13px] text-slate-600">
            <div>
               <p className="text-slate-400 font-medium mb-1">Company</p>
               <p className="text-slate-900">{customer.companyName || '-'}</p>
            </div>
            <div>
               <p className="text-slate-400 font-medium mb-1">Email</p>
               <p className="text-slate-900">{customer.email || '-'}</p>
            </div>
            <div>
               <p className="text-slate-400 font-medium mb-1">Phone</p>
               <p className="text-slate-900">{customer.workPhone || customer.mobile || '-'}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6">
           <div className="bg-white border border-slate-100 rounded-xl p-8 flex flex-col items-center justify-center text-center h-48">
              <h2 className="text-[16px] font-semibold text-slate-800 mb-2">Overview</h2>
              <p className="text-slate-500 text-[14px] max-w-sm">This is a placeholder for the detailed Customer Overview. Providing the required details structure when the design is ready.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailView;
