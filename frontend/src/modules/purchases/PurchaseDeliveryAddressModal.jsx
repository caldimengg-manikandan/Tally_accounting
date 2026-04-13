import React, { useState } from 'react';
import { X } from 'lucide-react';

const PurchaseDeliveryAddressModal = ({ onClose, onSave, initialData }) => {
  const [address, setAddress] = useState(initialData || {
    attention: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: ''
  });

  const handleChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onSave(address);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[110] animate-in fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-[18px] text-slate-800">New address</h2>
          <button 
            onClick={onClose} 
            className="text-red-500 hover:text-red-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 pb-12 overflow-y-auto max-h-[75vh] custom-scrollbar">
          <div className="space-y-5 max-w-xl">
            
            {/* Attention */}
            <div className="grid grid-cols-[140px_1fr] items-center">
              <label className="text-[13px] text-slate-700">Attention</label>
              <input 
                type="text" 
                name="attention"
                value={address.attention}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded text-[13px] text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Street 1 */}
            <div className="grid grid-cols-[140px_1fr] items-start">
              <label className="text-[13px] text-slate-700 mt-2">Street 1</label>
              <textarea 
                name="street1"
                value={address.street1}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded text-[13px] text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
              />
            </div>

            {/* Street 2 */}
            <div className="grid grid-cols-[140px_1fr] items-start">
              <label className="text-[13px] text-slate-700 mt-2">Street 2</label>
              <textarea 
                name="street2"
                value={address.street2}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded text-[13px] text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
              />
            </div>

            {/* City */}
            <div className="grid grid-cols-[140px_1fr] items-center">
              <label className="text-[13px] text-slate-700">City</label>
              <input 
                type="text" 
                name="city"
                value={address.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded text-[13px] text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* State/Province */}
            <div className="grid grid-cols-[140px_1fr] items-center">
              <label className="text-[13px] text-slate-700">State/Province</label>
              <input 
                type="text" 
                name="state"
                value={address.state}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded text-[13px] text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* ZIP/Postal Code */}
            <div className="grid grid-cols-[140px_1fr] items-center">
              <label className="text-[13px] text-slate-700">ZIP/Postal Code</label>
              <input 
                type="text" 
                name="zip"
                value={address.zip}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded text-[13px] text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Country/Region */}
            <div className="grid grid-cols-[140px_1fr] items-center">
              <label className="text-[13px] text-slate-700">Country/Region</label>
              <select 
                name="country"
                value={address.country}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded text-[13px] text-slate-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                 <option value="" className="text-slate-400">Select or type to add</option>
                 <option value="India">India</option>
                 <option value="United States">United States</option>
                 <option value="United Kingdom">United Kingdom</option>
              </select>
            </div>

            {/* Phone */}
            <div className="grid grid-cols-[140px_1fr] items-center">
              <label className="text-[13px] text-slate-700">Phone</label>
              <input 
                type="text" 
                name="phone"
                value={address.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded text-[13px] text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="py-4 px-6 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
          <button 
            onClick={handleSave}
            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-[13px] font-medium rounded transition-colors"
          >
            Save
          </button>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-[13px] font-medium rounded transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

export default PurchaseDeliveryAddressModal;
