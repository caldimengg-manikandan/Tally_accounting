import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Check, Search, Database, Upload, RefreshCw, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { priceListAPI, inventoryAPI } from '../../services/api';

const PriceListEntryView = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    transactionType: 'Sales',
    priceListType: 'All Items',
    description: '',
    markupType: 'Markup',
    percentage: '',
    roundOffTo: 'Never mind',
    pricingScheme: 'Unit Pricing',
    currency: 'INR - Indian Rupee',
    includeDiscount: false,
    itemRates: {} // { itemId: customRate }
  });

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isMarkupOpen, setIsMarkupOpen] = useState(false);
  const [isRoundOffOpen, setIsRoundOffOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);
  const [roundOffSearch, setRoundOffSearch] = useState('');
  const [currencySearch, setCurrencySearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  const markupOptions = ['Markup', 'Markdown'];
  const roundOffOptions = [
    'Never mind', 
    'Nearest whole number', 
    '0.99', 
    '0.50', 
    '0.49', 
    'Decimal Places'
  ];

  const currencyOptions = [
    'AED- UAE Dirham',
    'AUD- Australian Dollar',
    'BND- Brunei Dollar',
    'CAD- Canadian Dollar',
    'CNY- Yuan Renminbi',
    'EUR- Euro',
    'GBP- Pound Sterling',
    'INR- Indian Rupee',
    'JPY- Japanese Yen',
    'SAR- Saudi Riyal',
    'USD- United States Dollar',
    'ZAR- South African Rand'
  ];

  const filteredRoundOff = roundOffOptions.filter(opt => 
    opt.toLowerCase().includes(roundOffSearch.toLowerCase())
  );

  const filteredCurrency = currencyOptions.filter(opt =>
    opt.toLowerCase().includes(currencySearch.toLowerCase())
  );

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(itemSearch.toLowerCase())
  );

  useEffect(() => {
    if (formData.priceListType === 'Individual Items' && items.length === 0) {
      fetchItems();
    }
  }, [formData.priceListType]);

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const companyId = localStorage.getItem('companyId');
      if (companyId) {
        const res = await inventoryAPI.getByCompany(companyId);
        setItems(res.data || []);
      }
    } catch (err) {
      console.error('Fetch items failed:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleRateChange = (itemId, val) => {
    setFormData({
      ...formData,
      itemRates: {
        ...formData.itemRates,
        [itemId]: val
      }
    });
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!formData.name.trim()) {
        alert('Please fill the Name column. It is a required field.');
        return;
      }
      
      if (formData.priceListType === 'All Items') {
        if (formData.percentage === '' || formData.percentage === null || formData.percentage === undefined) {
          alert('Please fill the Percentage column. It is a required field.');
          return;
        }
      }

      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        alert('Company context missing. Please re-login.');
        return;
      }

      const payload = {
        ...formData,
        CompanyId: companyId
      };

      await priceListAPI.create(payload);
      alert('Price List saved successfully! ✨');
      navigate('/price-lists');
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save price list. Please try again.');
    }
  };

  return (
    <div className="flex flex-col bg-white h-[calc(100vh-80px)] font-sans animate-fade-in relative z-10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 shrink-0">
        <h2 className="text-[18px] font-bold text-slate-900">New Price List</h2>
        <button 
          onClick={() => navigate('/price-lists')}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative" onClick={() => { setIsMarkupOpen(false); setIsRoundOffOpen(false); setIsCurrencyOpen(false); }}>
        <div className="px-12 py-8 space-y-6 max-w-[1000px]">
          
          <div className="grid grid-cols-1 gap-5">
            {/* Name Field */}
            <div className="flex items-start">
              <label className="text-[12px] font-medium text-rose-500 w-[160px] pt-1.5 uppercase tracking-wider">Name*</label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-[320px] px-3 py-1.5 border border-slate-200 rounded focus:border-[#1e61f0] focus:ring-1 focus:ring-blue-100 outline-none text-[13px] transition-all"
                placeholder="Enter price list name"
              />
            </div>

            {/* Transaction Type */}
            <div className="flex items-center">
              <label className="text-[12px] font-medium text-slate-700 w-[160px] uppercase tracking-wider">Transaction Type</label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${formData.transactionType === 'Sales' ? 'border-[#1e61f0] bg-[#1e61f0]' : 'border-slate-300 bg-white group-hover:border-slate-400'}`}>
                    {formData.transactionType === 'Sales' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <input 
                    type="radio" 
                    className="hidden" 
                    checked={formData.transactionType === 'Sales'}
                    onChange={() => setFormData({...formData, transactionType: 'Sales'})}
                  />
                  <span className="text-[13px] text-slate-600 font-medium">Sales</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${formData.transactionType === 'Purchase' ? 'border-[#1e61f0] bg-[#1e61f0]' : 'border-slate-300 bg-white group-hover:border-slate-400'}`}>
                    {formData.transactionType === 'Purchase' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <input 
                    type="radio" 
                    className="hidden" 
                    checked={formData.transactionType === 'Purchase'}
                    onChange={() => setFormData({...formData, transactionType: 'Purchase'})}
                  />
                  <span className="text-[13px] text-slate-600 font-medium">Purchase</span>
                </label>
              </div>
            </div>

            {/* Price List Type */}
            <div className="flex items-start">
              <label className="text-[12px] font-medium text-slate-700 w-[160px] pt-4 uppercase tracking-wider">Price List Type</label>
              <div className="flex gap-4">
                <div 
                  onClick={() => setFormData({...formData, priceListType: 'All Items'})}
                  className={`w-[240px] p-3 rounded-lg border-2 transition-all cursor-pointer ${formData.priceListType === 'All Items' ? 'border-blue-200 bg-blue-50/40' : 'border-slate-50 hover:border-slate-100 bg-slate-50/30'}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 ${formData.priceListType === 'All Items' ? 'bg-[#1e61f0] border-[#1e61f0]' : 'border-slate-300 bg-white'}`}>
                      {formData.priceListType === 'All Items' && <Check size={10} color="white" strokeWidth={4} />}
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-slate-800 uppercase tracking-tight">All Items</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">Mark up or mark down the rates of all items</div>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => setFormData({...formData, priceListType: 'Individual Items'})}
                  className={`w-[240px] p-3 rounded-lg border-2 transition-all cursor-pointer ${formData.priceListType === 'Individual Items' ? 'border-blue-200 bg-blue-50/40' : 'border-slate-50 hover:border-slate-100 bg-slate-50/30'}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 ${formData.priceListType === 'Individual Items' ? 'bg-[#1e61f0] border-[#1e61f0]' : 'border-slate-300 bg-white'}`}>
                      {formData.priceListType === 'Individual Items' && <Check size={10} color="white" strokeWidth={4} />}
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-slate-800 uppercase tracking-tight">Individual Items</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">Customize the rate of each item</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="flex items-start">
              <label className="text-[12px] font-medium text-slate-700 w-[160px] pt-1.5 uppercase tracking-wider">Description</label>
              <textarea 
                placeholder="Enter the description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-[320px] px-3 py-2 border border-slate-200 rounded focus:border-[#1e61f0] outline-none text-[13px] min-h-[60px] resize-none"
              />
            </div>
          </div>

          <div className="border-t border-slate-50 pt-6">
            {formData.priceListType === 'All Items' ? (
              <div className="space-y-5 animate-slide-right">
                {/* Percentage (All Items Mode) */}
                <div className="flex items-center">
                  <label className="text-[12px] font-medium text-rose-500 w-[160px] uppercase tracking-wider">Percentage*</label>
                  <div className="w-[320px] flex border border-slate-200 rounded focus-within:border-[#1e61f0] bg-white relative">
                    <div 
                      className="relative border-r border-slate-200 bg-slate-50/50 cursor-pointer min-w-[100px]"
                      onClick={(e) => { e.stopPropagation(); setIsMarkupOpen(!isMarkupOpen); setIsRoundOffOpen(false); }}
                    >
                      <div className="pl-3 pr-8 py-1.5 text-[13px] text-slate-700 flex items-center justify-between">
                        {formData.markupType}
                        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isMarkupOpen ? 'rotate-180' : ''}`} />
                      </div>
                      
                      {isMarkupOpen && (
                        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-100 rounded shadow-xl z-50 py-1 overflow-hidden">
                          {markupOptions.map(opt => (
                            <div 
                              key={opt}
                              onClick={() => { setFormData({...formData, markupType: opt}); setIsMarkupOpen(false); }}
                              className={`px-3 py-1.5 text-[13px] transition-colors ${formData.markupType === opt ? 'bg-[#1e61f0] text-white' : 'hover:bg-slate-50 text-slate-700'}`}
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <input 
                      type="number"
                      value={formData.percentage}
                      onChange={(e) => setFormData({...formData, percentage: e.target.value})}
                      className="flex-1 px-3 py-1.5 outline-none text-[13px]"
                    />
                    <div className="px-3 py-1.5 bg-slate-50/50 text-slate-400 text-[13px] border-l border-slate-200">%</div>
                  </div>
                </div>

                {/* Round Off (All Items Mode) */}
                <div className="flex items-center">
                  <label className="text-[12px] font-medium text-rose-500 w-[160px] uppercase tracking-wider">Round Off To*</label>
                  <div className="w-[320px] relative">
                    <div 
                      onClick={(e) => { e.stopPropagation(); setIsRoundOffOpen(!isRoundOffOpen); setIsMarkupOpen(false); }}
                      className={`w-full px-3 py-1.5 border border-slate-200 rounded text-[13px] bg-white cursor-pointer flex items-center justify-between transition-all ${isRoundOffOpen ? 'border-[#1e61f0] ring-1 ring-blue-50' : ''}`}
                    >
                      <span className="text-slate-700">{formData.roundOffTo}</span>
                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${isRoundOffOpen ? 'rotate-180 text-[#1e61f0]' : ''}`} />
                    </div>

                    {isRoundOffOpen && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-100 rounded shadow-2xl z-50 py-2 animate-fade-in-fast" onClick={(e) => e.stopPropagation()}>
                        <div className="px-2 mb-2">
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              autoFocus
                              type="text"
                              placeholder="Search"
                              value={roundOffSearch}
                              onChange={(e) => setRoundOffSearch(e.target.value)}
                              className="w-full pl-9 pr-3 py-1.5 border border-slate-100 bg-slate-50/50 rounded outline-none text-[12px] focus:border-slate-200"
                            />
                          </div>
                        </div>
                        
                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                          {filteredRoundOff.map(opt => (
                            <div 
                              key={opt}
                              onClick={() => { setFormData({...formData, roundOffTo: opt}); setIsRoundOffOpen(false); setRoundOffSearch(''); }}
                              className={`px-4 py-2 text-[12px] flex items-center justify-between cursor-pointer transition-colors ${formData.roundOffTo === opt ? 'bg-[#1e61f0] text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                            >
                              {opt}
                              {formData.roundOffTo === opt && <Check size={14} strokeWidth={3} />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pl-[160px] relative">
                  <button 
                    onClick={() => setIsExamplesOpen(!isExamplesOpen)}
                    className="text-[12px] text-[#1e61f0] hover:underline cursor-pointer"
                  >
                    View Examples
                  </button>

                  {/* View Examples Popup Dropdown */}
                  {isExamplesOpen && (
                    <div className="absolute top-[calc(100%+8px)] left-[160px] w-[450px] bg-white border border-slate-200 shadow-xl rounded-lg z-50 animate-fade-in-fast">
                      {/* Triangle Pointer */}
                      <div className="absolute -top-[7px] left-8 w-3 h-3 bg-white border-t border-l border-slate-200 rotate-45"></div>
                      
                      {/* Popup Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <span className="text-[14px] text-slate-800">Rounding Examples</span>
                        <button 
                          onClick={() => setIsExamplesOpen(false)}
                          className="text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors"
                        >
                          <X size={16} strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Popup Table */}
                      <div className="px-4 py-2">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100">
                              <th className="py-2 text-[11px] font-black text-slate-500 uppercase tracking-widest">Round Off To</th>
                              <th className="py-2 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Input Value</th>
                              <th className="py-2 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Rounded Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[13px]">
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 text-[#1e61f0]">Never mind</td>
                              <td className="py-3 text-right text-slate-700">1000.678</td>
                              <td className="py-3 text-right text-slate-700">1000.678</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 text-[#1e61f0]">Nearest whole number</td>
                              <td className="py-3 text-right text-slate-700">1000.678</td>
                              <td className="py-3 text-right text-slate-700">1001</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 text-[#1e61f0]">0.99</td>
                              <td className="py-3 text-right text-slate-700">1000.678</td>
                              <td className="py-3 text-right text-slate-700">1000.99</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 text-[#1e61f0]">0.50</td>
                              <td className="py-3 text-right text-slate-700">1000.678</td>
                              <td className="py-3 text-right text-slate-700">1000.50</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 text-[#1e61f0]">0.49</td>
                              <td className="py-3 text-right text-slate-700">1000.678</td>
                              <td className="py-3 text-right text-slate-700">1000.49</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 text-[#1e61f0]">Decimal Places</td>
                              <td className="py-3 text-right text-slate-700"></td>
                              <td className="py-3 text-right text-slate-700"></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-slide-left">
                {/* Pricing Scheme (Individual Items Mode) */}
                <div className="flex items-center">
                  <label className="text-[12px] font-medium text-slate-600 w-[160px] uppercase tracking-wider">Pricing Scheme</label>
                  <div className="flex items-center gap-4">
                    <label className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${formData.pricingScheme === 'Unit Pricing' ? 'bg-blue-50 border-blue-200 text-[#1e61f0]' : 'bg-slate-50/50 border-slate-100 text-slate-500'}`}>
                      <input 
                        type="radio" 
                        name="pricingScheme" 
                        className="hidden" 
                        checked={formData.pricingScheme === 'Unit Pricing'} 
                        onChange={() => setFormData({...formData, pricingScheme: 'Unit Pricing'})}
                      />
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${formData.pricingScheme === 'Unit Pricing' ? 'border-[#1e61f0]' : 'border-slate-300'}`}>
                        {formData.pricingScheme === 'Unit Pricing' && <div className="w-1.5 h-1.5 rounded-full bg-[#1e61f0]" />}
                      </div>
                      <span className="text-[12px] font-bold">Unit Pricing</span>
                    </label>
                    <label className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${formData.pricingScheme === 'Volume Pricing' ? 'bg-blue-50 border-blue-200 text-[#1e61f0]' : 'bg-slate-50/50 border-slate-100 text-slate-500'}`}>
                      <input 
                        type="radio" 
                        name="pricingScheme" 
                        className="hidden" 
                        checked={formData.pricingScheme === 'Volume Pricing'} 
                        onChange={() => setFormData({...formData, pricingScheme: 'Volume Pricing'})}
                      />
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${formData.pricingScheme === 'Volume Pricing' ? 'border-[#1e61f0]' : 'border-slate-300'}`}>
                        {formData.pricingScheme === 'Volume Pricing' && <div className="w-1.5 h-1.5 rounded-full bg-[#1e61f0]" />}
                      </div>
                      <span className="text-[12px] font-bold">Volume Pricing</span>
                    </label>
                  </div>
                </div>

                {/* Currency */}
                <div className="flex items-center">
                  <label className="text-[12px] font-bold text-slate-700 w-[160px] uppercase tracking-wider">Currency</label>
                  <div className="w-[320px] relative">
                    <div 
                      onClick={(e) => { e.stopPropagation(); setIsCurrencyOpen(!isCurrencyOpen); setIsMarkupOpen(false); setIsRoundOffOpen(false); }}
                      className={`w-full px-3 py-1.5 border border-slate-200 rounded text-[13px] bg-white cursor-pointer flex items-center justify-between transition-all ${isCurrencyOpen ? 'border-[#1e61f0] ring-1 ring-blue-50' : ''}`}
                    >
                      <span className="text-slate-700">{formData.currency}</span>
                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${isCurrencyOpen ? 'rotate-180 text-[#1e61f0]' : ''}`} />
                    </div>

                    {isCurrencyOpen && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-100 rounded shadow-2xl z-50 py-2 animate-fade-in-fast" onClick={(e) => e.stopPropagation()}>
                        <div className="px-2 mb-2">
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              autoFocus
                              type="text"
                              placeholder="Search"
                              value={currencySearch}
                              onChange={(e) => setCurrencySearch(e.target.value)}
                              className="w-full pl-9 pr-3 py-1.5 border border-slate-100 bg-slate-50/50 rounded outline-none text-[12px] focus:border-slate-200"
                            />
                          </div>
                        </div>
                        
                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                          {filteredCurrency.map(opt => (
                            <div 
                              key={opt}
                              onClick={() => { setFormData({...formData, currency: opt}); setIsCurrencyOpen(false); setCurrencySearch(''); }}
                              className={`px-4 py-2 text-[12px] flex items-center justify-between cursor-pointer transition-colors ${formData.currency === opt ? 'bg-[#1e61f0] text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                            >
                              {opt}
                              {formData.currency === opt && <Check size={14} strokeWidth={3} />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Discount Percentage */}
                <div className="flex items-center">
                  <label className="text-[12px] font-bold text-slate-700 w-[160px] uppercase tracking-wider">Discount</label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${formData.includeDiscount ? 'bg-[#1e61f0] border-[#1e61f0]' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
                      {formData.includeDiscount && <Check size={12} color="white" strokeWidth={4} />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={formData.includeDiscount}
                      onChange={() => setFormData({...formData, includeDiscount: !formData.includeDiscount})}
                    />
                    <span className="text-[13px] text-slate-600 font-medium">I want to include discount percentage for the items</span>
                  </label>
                </div>

                {/* Full-Width Separator Line */}
                <div className="h-8 w-full mb-4">
                  <div className="absolute left-0 right-0 border-t border-slate-900" />
                </div>

                {/* Bulk Customization Table */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-4 pb-2">
                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                      <Layers size={18} className="text-[#1e61f0]" />
                      <span className="text-[13px] uppercase tracking-wider">Customise Rates in Bulk</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1 text-[11px] font-bold text-[#1e61f0] hover:underline uppercase tracking-wider">
                        <RefreshCw size={12} />
                        Update Rates in Bulk
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-medium uppercase tracking-tighter">Import Price List for Items</span>
                        <div className="w-8 h-4 bg-slate-200 rounded-full relative cursor-pointer">
                          <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* The Table */}
                  <div className="border border-slate-100 rounded-lg overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100">
                          <th className="px-4 py-2.5 text-[10px] font-black text-slate-900 uppercase tracking-widest">
                            <div className="flex items-center gap-1.5">
                              ITEM DETAILS
                              <Search size={12} className="text-slate-900/60" />
                            </div>
                          </th>
                          <th className="px-4 py-2.5 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">SALES RATE</th>
                          <th className="px-4 py-2.5 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">CUSTOM RATE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
                        {loadingItems ? (
                          <tr><td colSpan="3" className="px-4 py-8 text-center text-[12px] text-slate-400 italic">Loading inventory items...</td></tr>
                        ) : filteredItems.length > 0 ? (
                          filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 text-[13px] font-bold text-slate-900">{item.name}</td>
                              <td className="px-4 py-3 text-[13px] text-slate-900 text-right font-medium">₹{parseFloat(item.sellingPrice || 0).toLocaleString()}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5 ml-auto w-[120px]">
                                  <span className="text-slate-900 text-[12px]">₹</span>
                                  <input 
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.itemRates[item.id] || ''}
                                    onChange={(e) => handleRateChange(item.id, e.target.value)}
                                    className="w-full px-2 py-1 text-right text-[13px] font-bold text-slate-900 border-b border-slate-100 focus:border-[#1e61f0] outline-none transition-colors"
                                  />
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="3" className="px-4 py-8 text-center text-[12px] text-slate-400">No items found in your inventory.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 border-t border-slate-100 bg-[#fbfcfd] flex items-center gap-3 shrink-0">
        <button 
          onClick={handleSave}
          className="bg-[#1e61f0] text-white px-8 py-2.5 rounded font-black text-[12px] uppercase tracking-widest hover:bg-[#1a54d1] shadow-xl shadow-blue-500/30 transition-all active:scale-95"
        >
          SAVE
        </button>
        <button 
          onClick={() => navigate('/price-lists')}
          className="px-8 py-2.5 border border-slate-200 text-slate-500 rounded font-black text-[12px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 bg-white"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
};

export default PriceListEntryView;
