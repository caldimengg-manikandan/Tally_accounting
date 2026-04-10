import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

const CreateCurrencyModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    code: '',
    symbol: '',
    name: '',
    decimalPlaces: '2',
    format: '###,###.##'
  });

  const currencyCodes = [
    'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN',
    'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL',
    'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY',
    'COP', 'CRC', 'CUC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD',
    'EGP', 'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GGP', 'GHS',
    'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HRK', 'HTG', 'HUF',
    'IDR', 'ILS', 'IMP', 'INR', 'IQD', 'IRR', 'ISK', 'JEP', 'JMD', 'JOD',
    'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD', 'KYD', 'KZT',
    'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD',
    'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN'
  ];

  const decimalOptions = ['0', '1', '2', '3', '4'];
  const formatOptions = ['###,###.##', '###.###,##', '### ###.##', '###,###'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.code || !formData.symbol || !formData.name) {
      alert("Please fill in all required fields marked with *");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[500px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <h2 className="text-[18px] font-bold text-slate-800">New Currency</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          
          {/* Currency Code */}
          <div className="space-y-2">
            <label className="text-[14px] font-medium text-red-500">Currency Code*</label>
            <div className="relative">
              <select 
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full h-11 pl-4 pr-10 text-[14px] border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none bg-white"
              >
                <option value="">Select</option>
                {currencyCodes.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Currency Symbol */}
          <div className="space-y-2">
            <label className="text-[14px] font-medium text-red-500">Currency Symbol*</label>
            <input 
              type="text"
              name="symbol"
              value={formData.symbol}
              onChange={handleChange}
              className="w-full h-11 px-4 text-[14px] border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              placeholder="e.g. ₹"
            />
          </div>

          {/* Currency Name */}
          <div className="space-y-2">
            <label className="text-[14px] font-medium text-red-500">Currency Name*</label>
            <input 
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full h-11 px-4 text-[14px] border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              placeholder="e.g. Indian Rupee"
            />
          </div>

          {/* Decimal Places */}
          <div className="space-y-2">
            <label className="text-[14px] font-medium text-slate-600">Decimal Places</label>
            <div className="relative">
              <select 
                name="decimalPlaces"
                value={formData.decimalPlaces}
                onChange={handleChange}
                className="w-full h-11 pl-4 pr-10 text-[14px] border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none bg-white"
              >
                {decimalOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <label className="text-[14px] font-medium text-slate-600">Format</label>
            <div className="relative">
              <select 
                name="format"
                value={formData.format}
                onChange={handleChange}
                className="w-full h-11 pl-4 pr-10 text-[14px] border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none bg-white"
              >
                {formatOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex items-center gap-3 mt-auto">
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-bold rounded-lg shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
            Save and Select
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[14px] font-bold rounded-lg active:scale-95 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCurrencyModal;
