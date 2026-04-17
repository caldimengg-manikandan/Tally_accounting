import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Check, Search, Database, Upload, RefreshCw, Layers, Plus, Download } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { priceListAPI, inventoryAPI } from '../../services/api';
import * as XLSX from 'xlsx';

const PriceListEntryView = ({ companyId: propCompanyId }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  // State-based companyId to ensure reactivity across refreshes and company switches
  const [activeCompanyId, setActiveCompanyId] = useState(propCompanyId || localStorage.getItem('companyId'));
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    transactionType: 'Sales',
    priceListType: 'All Items',
    description: '',
    markupType: 'Markup',
    percentage: '',
    roundOffTo: 'Never mind',
    pricingScheme: 'Volume Pricing',
    currency: 'INR - Indian Rupee',
    includeDiscount: false,
    itemRates: {}, // { itemId: customRate } for Unit Pricing
    itemDiscounts: {}, // { itemId: discountPercentage } for Unit Pricing
    volumeRates: {}, // { itemId: [{ start: 1, end: '', rate: '', discount: '' }] } for Volume Pricing
    showImportSection: false,
    selectedItemIds: [],
    isBulkUpdateMode: false,
    showBulkOptions: false,
    bulkAction: { type: 'Markup', value: '', mode: 'Percentage' } // mode: 'Percentage' or 'Fixed'
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

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(itemSearch.toLowerCase());
    
    // Relaxed filtering: Allow ₹0 items so users can set their first prices here
    const isSales = !!item.salesInformation;
    const isPurchase = !!item.purchaseInformation;

    const matchesTransactionType = formData.transactionType === 'Sales' ? isSales : isPurchase;
    
    return matchesSearch && matchesTransactionType;
  });

  console.log(`[DEBUG] Price List Rendering: Type=${formData.transactionType}, Showing ${filteredItems.length}/${items.length} items`);

  // Periodically check for company ID if it was missing initially
  useEffect(() => {
    if (!activeCompanyId) {
      const storedId = localStorage.getItem('companyId');
      if (storedId) setActiveCompanyId(storedId);
    }
  }, [activeCompanyId]);

  useEffect(() => {
    if (activeCompanyId) {
      fetchItems();
    }
  }, [activeCompanyId]);

  useEffect(() => {
    if (isEditMode) {
      fetchPriceListDetails();
    }
  }, [id]);

  const fetchPriceListDetails = async () => {
    try {
      const res = await priceListAPI.getById(id);
      if (res.data) {
        setFormData(prev => ({
          ...prev,
          ...res.data,
          // Ensure nested objects are handled if they come back from API differently
          itemRates: res.data.itemRates || {},
          volumeRates: res.data.volumeRates || {},
        }));
      }
    } catch (err) {
      console.error('Fetch price list failed:', err);
      alert('Failed to load price list details.');
    }
  };

  const fetchItems = async () => {
    // If we're already loading or have items, don't show the "Loading..." flash unless we have none
    if (items.length === 0) setLoadingItems(true);
    
    try {
      const targetCompanyId = activeCompanyId || localStorage.getItem('companyId');
      if (targetCompanyId) {
        const res = await inventoryAPI.getByCompany(targetCompanyId);
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

  const handleDiscountChange = (itemId, val) => {
    setFormData({
      ...formData,
      itemDiscounts: {
        ...formData.itemDiscounts,
        [itemId]: val
      }
    });
  };

  const addVolumeRange = (itemId) => {
    const currentRanges = formData.volumeRates[itemId] || [{ start: 1, end: '', rate: '', discount: '' }];
    const lastRange = currentRanges[currentRanges.length - 1];
    const newStart = lastRange.end ? parseInt(lastRange.end) + 1 : '';

    setFormData({
      ...formData,
      volumeRates: {
        ...formData.volumeRates,
        [itemId]: [...currentRanges, { start: newStart, end: '', rate: '', discount: '' }]
      }
    });
  };

  const updateVolumeRange = (itemId, index, field, value) => {
    const currentRanges = [...(formData.volumeRates[itemId] || [{ start: 1, end: '', rate: '', discount: '' }])];
    currentRanges[index] = { ...currentRanges[index], [field]: value };
    
    setFormData({
      ...formData,
      volumeRates: {
        ...formData.volumeRates,
        [itemId]: currentRanges
      }
    });
  };

  const removeVolumeRange = (itemId, index) => {
    const currentRanges = [...(formData.volumeRates[itemId] || [])];
    if (currentRanges.length <= 1) return;
    currentRanges.splice(index, 1);
    
    setFormData({
      ...formData,
      volumeRates: {
        ...formData.volumeRates,
        [itemId]: currentRanges
      }
    });
  };

  const handleExportAll = () => {
    try {
      if (items.length === 0) {
        alert('No items available to export.');
        return;
      }

      // Format data for Excel
      const excelData = items.map(item => {
        const row = {
          'Item Name': item.name,
          'Start Quantity': 1,
          'End Quantity': '',
          'PriceList Rate': (formData.transactionType === 'Sales' ? item.sellingPrice : item.costPrice) || 0
        };
        if (formData.includeDiscount) {
          row['Discount (%)'] = 0;
        }
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Price List Items');

      // Add column widths
      const cols = [
        { wch: 30 }, // Item Name
        { wch: 15 }, // Start Qty
        { wch: 15 }, // End Qty
        { wch: 15 }  // Rate
      ];
      if (formData.includeDiscount) {
        cols.push({ wch: 15 }); // Discount
      }
      worksheet['!cols'] = cols;

      XLSX.writeFile(workbook, `PriceList_Template_${new Date().toLocaleDateString()}.xlsx`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export items. Please try again.');
    }
  };

  const handleExportFiltered = () => {
    try {
      if (filteredItems.length === 0) {
        alert('No filtered items to export.');
        return;
      }

      const excelData = filteredItems.map(item => {
        const row = {
          'Item Name': item.name,
          'Start Quantity': 1,
          'End Quantity': '',
          'PriceList Rate': (formData.transactionType === 'Sales' ? item.sellingPrice : item.costPrice) || 0
        };
        if (formData.includeDiscount) {
          row['Discount (%)'] = 0;
        }
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Filtered Items');

      const cols = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      if (formData.includeDiscount) cols.push({ wch: 15 });
      worksheet['!cols'] = cols;

      XLSX.writeFile(workbook, `Filtered_PriceList_${new Date().toLocaleDateString()}.xlsx`);
    } catch (err) {
      console.error('Filtered export failed:', err);
      alert('Failed to export filtered items.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          alert('The uploaded file is empty.');
          return;
        }

        const newItemRates = { ...formData.itemRates };
        const newItemDiscounts = { ...formData.itemDiscounts };
        const newVolumeRates = { ...formData.volumeRates };

        // Process data
        jsonData.forEach(row => {
          const itemName = row['Item Name'];
          const matchedItem = items.find(it => it.name.toLowerCase() === itemName?.toString().toLowerCase());
          
          if (matchedItem) {
            if (formData.pricingScheme === 'Unit Pricing') {
              newItemRates[matchedItem.id] = row['PriceList Rate'] || 0;
              if (formData.includeDiscount) {
                newItemDiscounts[matchedItem.id] = row['Discount (%)'] || 0;
              }
            } else {
              // Volume Pricing - Grouping by item
              if (!newVolumeRates[matchedItem.id]) {
                newVolumeRates[matchedItem.id] = [];
              }
              newVolumeRates[matchedItem.id].push({
                start: row['Start Quantity'] || 1,
                end: row['End Quantity'] || '',
                rate: row['PriceList Rate'] || 0,
                discount: row['Discount (%)'] || 0
              });
            }
          }
        });

        setFormData({
          ...formData,
          itemRates: newItemRates,
          itemDiscounts: newItemDiscounts,
          volumeRates: newVolumeRates,
          showImportSection: false // Switch back to see the results
        });

        alert('Data imported successfully! Check the customization table.');
      } catch (err) {
        console.error('Import failed:', err);
        alert('Failed to parse the file. Please ensure it matches the template.');
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset input
    e.target.value = '';
  };

  const toggleItemSelection = (itemId) => {
    const selected = [...formData.selectedItemIds];
    const index = selected.indexOf(itemId);
    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(itemId);
    }
    setFormData({ ...formData, selectedItemIds: selected });
  };

  const toggleSelectAll = () => {
    if (formData.selectedItemIds.length === filteredItems.length) {
      setFormData({ ...formData, selectedItemIds: [] });
    } else {
      setFormData({ ...formData, selectedItemIds: filteredItems.map(it => it.id) });
    }
  };

  const applyBulkUpdate = () => {
    const { type, value, mode } = formData.bulkAction;
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      alert('Please enter a valid number.');
      return;
    }

    const newItemRates = { ...formData.itemRates };
    const newVolumeRates = { ...formData.volumeRates };

    formData.selectedItemIds.forEach(itemId => {
      const item = items.find(it => it.id === itemId);
      if (!item) return;

      const basePrice = parseFloat((formData.transactionType === 'Sales' ? item.sellingPrice : item.costPrice) || 0);

      if (formData.pricingScheme === 'Unit Pricing') {
        if (mode === 'Fixed') {
          newItemRates[itemId] = numValue;
        } else {
          const change = (basePrice * numValue) / 100;
          newItemRates[itemId] = type === 'Markup' ? basePrice + change : basePrice - change;
        }
      } else {
        // Volume Pricing - Update all ranges
        const currentRanges = [...(newVolumeRates[itemId] || [{ start: 1, end: '', rate: basePrice }])];
        newVolumeRates[itemId] = currentRanges.map(range => {
          const currentRate = parseFloat(range.rate || basePrice);
          let newRate = currentRate;
          if (mode === 'Fixed') {
            newRate = numValue;
          } else {
            const change = (currentRate * numValue) / 100;
            newRate = type === 'Markup' ? currentRate + change : currentRate - change;
          }
          return { ...range, rate: newRate };
        });
      }
    });

    setFormData({
      ...formData,
      itemRates: newItemRates,
      volumeRates: newVolumeRates,
      selectedItemIds: [],
      showBulkOptions: false
    });

    alert('Bulk update applied successfully!');
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

      const payload = {
        ...formData,
        CompanyId: activeCompanyId
      };

      if (isEditMode) {
        await priceListAPI.update(id, payload);
        alert('Price List updated successfully! ✨');
      } else {
        await priceListAPI.create(payload);
        alert('Price List saved successfully! ✨');
      }
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
        <h2 className="text-[18px] font-bold text-slate-900">{isEditMode ? 'Edit Price List' : 'New Price List'}</h2>
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
              <label className="text-[13px] font-medium text-rose-500 w-[160px] pt-1.5 focus-within:text-[#1e61f0] transition-colors">Name*</label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-[320px] px-3 py-1.5 border border-slate-200 rounded focus:border-[#1e61f0] focus:ring-1 focus:ring-blue-100 outline-none text-[13px] transition-all"
                placeholder="Enter price list name"
              />
            </div>

            {/* Transaction Type */}
            <div className={`flex items-center ${isEditMode ? 'opacity-80' : ''}`}>
              <label className="text-[13px] font-medium text-slate-700 w-[160px]">Transaction Type</label>
              <div className="flex items-center gap-6">
                <label className={`flex items-center gap-2 ${isEditMode ? 'cursor-not-allowed' : 'cursor-pointer group'}`}>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${formData.transactionType === 'Sales' ? 'border-[#1e61f0] bg-[#1e61f0]' : 'border-slate-300 bg-white group-hover:border-slate-400'}`}>
                    {formData.transactionType === 'Sales' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <input 
                    type="radio" 
                    className="hidden" 
                    checked={formData.transactionType === 'Sales'}
                    onChange={() => !isEditMode && setFormData({...formData, transactionType: 'Sales'})}
                    disabled={isEditMode}
                  />
                  <span className="text-[13px] text-slate-600 font-medium">Sales</span>
                </label>
                <label className={`flex items-center gap-2 ${isEditMode ? 'cursor-not-allowed' : 'cursor-pointer group'}`}>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${formData.transactionType === 'Purchase' ? 'border-[#1e61f0] bg-[#1e61f0]' : 'border-slate-300 bg-white group-hover:border-slate-400'}`}>
                    {formData.transactionType === 'Purchase' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <input 
                    type="radio" 
                    className="hidden" 
                    checked={formData.transactionType === 'Purchase'}
                    onChange={() => !isEditMode && setFormData({...formData, transactionType: 'Purchase'})}
                    disabled={isEditMode}
                  />
                  <span className="text-[13px] text-slate-600 font-medium">Purchase</span>
                </label>
              </div>
            </div>

            {/* Price List Type */}
            <div className={`flex items-start ${isEditMode ? 'opacity-80' : ''}`}>
              <label className="text-[13px] font-medium text-slate-700 w-[160px] pt-4">Price List Type</label>
              <div className="flex gap-4">
                <div 
                  onClick={() => !isEditMode && setFormData({...formData, priceListType: 'All Items'})}
                  className={`w-[240px] p-3 rounded-lg border-2 transition-all ${isEditMode ? 'cursor-not-allowed' : 'cursor-pointer'} ${formData.priceListType === 'All Items' ? 'border-blue-200 bg-blue-50/40' : 'border-slate-50 hover:border-slate-100 bg-slate-50/30'}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${formData.priceListType === 'All Items' ? 'bg-[#1e61f0] border-[#1e61f0]' : 'border-slate-300 bg-white'}`}>
                      {formData.priceListType === 'All Items' && <div className="w-1.5 h-1.5 rounded-full bg-white transition-all transform scale-110" />}
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-slate-800">All Items</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">Mark up or mark down the rates of all items</div>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => {
                    if (!isEditMode) {
                      setFormData({...formData, priceListType: 'Individual Items'});
                      // Guarantee a fresh fetch when switching to Individual Items mode
                      fetchItems();
                    }
                  }}
                  className={`w-[240px] p-3 rounded-lg border-2 transition-all ${isEditMode ? 'cursor-not-allowed' : 'cursor-pointer'} ${formData.priceListType === 'Individual Items' ? 'border-blue-200 bg-blue-50/40' : 'border-slate-50 hover:border-slate-100 bg-slate-50/30'}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${formData.priceListType === 'Individual Items' ? 'bg-[#1e61f0] border-[#1e61f0]' : 'border-slate-300 bg-white'}`}>
                      {formData.priceListType === 'Individual Items' && <div className="w-1.5 h-1.5 rounded-full bg-white transition-all transform scale-110" />}
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-slate-800">Individual Items</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">Customize the rate of each item</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="flex items-start">
              <label className="text-[13px] font-medium text-slate-700 w-[160px] pt-1.5">Description</label>
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
                  <label className="text-[13px] font-medium text-slate-700 w-[160px]">Pricing Scheme</label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${formData.pricingScheme === 'Unit Pricing' ? 'border-[#1e61f0] bg-[#1e61f0]' : 'border-slate-300 bg-white group-hover:border-slate-400'}`}>
                        {formData.pricingScheme === 'Unit Pricing' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <input 
                        type="radio" 
                        className="hidden" 
                        checked={formData.pricingScheme === 'Unit Pricing'}
                        onChange={() => setFormData({...formData, pricingScheme: 'Unit Pricing'})}
                      />
                      <span className="text-[13px] text-slate-600 font-medium">Unit Pricing</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${formData.pricingScheme === 'Volume Pricing' ? 'border-[#1e61f0] bg-[#1e61f0]' : 'border-slate-300 bg-white group-hover:border-slate-400'}`}>
                        {formData.pricingScheme === 'Volume Pricing' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <input 
                        type="radio" 
                        className="hidden" 
                        checked={formData.pricingScheme === 'Volume Pricing'}
                        onChange={() => setFormData({...formData, pricingScheme: 'Volume Pricing'})}
                      />
                      <span className="text-[13px] text-slate-600 font-medium">Volume Pricing</span>
                    </label>
                    <div className="group relative">
                      <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 cursor-help hover:border-[#1e61f0] hover:text-[#1e61f0] transition-colors font-black">?</div>
                    </div>
                  </div>
                </div>

                {/* Currency */}
                <div className="flex items-center">
                  <label className="text-[13px] font-medium text-slate-700 w-[160px]">Currency</label>
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
                  <label className="text-[13px] font-medium text-slate-700 w-[160px]">Discount</label>
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
                <div className="h-px bg-slate-100 w-[1000px] my-6" />

                {/* Bulk Customization Table */}
                <div className="pt-2">
                  <div className="flex flex-col gap-1.5 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="text-slate-900 font-bold text-[14px]">Customise Rates in Bulk</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-medium uppercase tracking-tighter">Import Price List for Items</span>
                        <div 
                          onClick={() => setFormData({...formData, showImportSection: !formData.showImportSection})}
                          className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${formData.showImportSection ? 'bg-[#1e61f0]' : 'bg-slate-200'}`}
                        >
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${formData.showImportSection ? 'left-4.5' : 'left-0.5'}`} />
                        </div>
                      </div>
                    </div>
                    {formData.priceListType === 'Individual Items' && !formData.isBulkUpdateMode && (
                      <button 
                        onClick={() => setFormData({...formData, isBulkUpdateMode: true})}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-[#1e61f0] hover:opacity-80 transition-all uppercase tracking-wider w-fit"
                      >
                        <RefreshCw size={12} className="text-[#1e61f0]" />
                        Update Rates in Bulk
                      </button>
                    )}
                  </div>

                  {/* Bulk Update Bar */}
                  {formData.isBulkUpdateMode && (
                    <div className="mb-4 bg-[#f0f5ff] rounded-md px-4 py-2 flex items-center justify-between animate-fade-in relative shadow-sm">
                      <div className="flex items-center">
                        <div className="relative">
                          <div className="px-4 py-1.5 bg-white border border-slate-200 rounded text-[12px] text-slate-600 font-medium">
                            Update Rates in Bulk
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setFormData({...formData, isBulkUpdateMode: false, selectedItemIds: []})}
                        className="text-[#1e61f0] hover:text-blue-600 p-1 rounded-full transition-all"
                      >
                        <X size={16} strokeWidth={2} />
                      </button>
                    </div>
                  )}

                  {/* Conditional Content: Table or Import Section */}
                  {!formData.showImportSection ? (
                    <div className="border border-slate-100 rounded-lg bg-white shadow-sm overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100">
                            {formData.isBulkUpdateMode && (
                              <th className="px-4 py-2.5 w-10">
                                {/* Empty checkbox area as per design in bulk update mode */}
                              </th>
                            )}
                            <th className="px-4 py-2.5 text-[10px] font-black text-slate-900 uppercase tracking-widest">
                              <div className="flex items-center gap-1.5">
                                ITEM DETAILS
                                <Search size={12} className="text-[#1e61f0]" />
                              </div>
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">{formData.transactionType === 'Sales' ? 'SALES RATE' : 'PURCHASE RATE'}</th>
                            {formData.pricingScheme === 'Volume Pricing' && (
                              <>
                                <th className="px-4 py-2.5 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">START QUANTITY</th>
                                <th className="px-4 py-2.5 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">END QUANTITY</th>
                              </>
                            )}
                            <th className="px-4 py-2.5 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">CUSTOM RATE</th>
                            {formData.includeDiscount && (
                              <th className="px-4 py-2.5 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">DISCOUNT (%)</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
                          {loadingItems ? (
                            <tr><td colSpan={formData.pricingScheme === 'Volume Pricing' ? (formData.includeDiscount ? 7 : 6) : (formData.includeDiscount ? 5 : 4)} className="px-4 py-8 text-center text-[12px] text-slate-400 italic">Loading inventory items...</td></tr>
                          ) : filteredItems.length > 0 ? (
                            filteredItems.map(item => {
                              const ranges = formData.volumeRates[item.id] || [{ start: 1, end: '', rate: '', discount: '' }];
                              const isSelected = formData.selectedItemIds.includes(item.id);
                              
                              return (
                                <React.Fragment key={item.id}>
                                  {formData.pricingScheme === 'Unit Pricing' ? (
                                    <tr className={`hover:bg-slate-50 transition-colors border-b border-slate-50 ${isSelected ? 'bg-blue-50/30' : ''}`}>
                                      {formData.isBulkUpdateMode && (
                                        <td className="px-4 py-3">
                                          <label className="flex items-center cursor-pointer group">
                                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-[#1e61f0] border-[#1e61f0]' : 'bg-white border-slate-300'}`}>
                                              {isSelected && <Check size={10} color="white" strokeWidth={4} />}
                                            </div>
                                            <input 
                                              type="checkbox" 
                                              className="hidden" 
                                              checked={isSelected} 
                                              onChange={() => toggleItemSelection(item.id)} 
                                            />
                                          </label>
                                        </td>
                                      )}
                                      <td className="px-4 py-3 text-[13px] font-bold text-slate-900">{item.name}</td>
                                      <td className="px-4 py-3 text-[13px] text-slate-900 text-right font-medium">₹{parseFloat((formData.transactionType === 'Sales' ? item.sellingPrice : item.costPrice) || 0).toLocaleString()}</td>
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
                                      {formData.includeDiscount && (
                                        <td className="px-4 py-3 text-right">
                                          <div className="flex items-center justify-end gap-1.5 ml-auto w-[80px]">
                                            <input 
                                              type="number"
                                              placeholder="0"
                                              value={formData.itemDiscounts[item.id] || ''}
                                              onChange={(e) => handleDiscountChange(item.id, e.target.value)}
                                              className="w-full px-2 py-1 text-right text-[13px] font-medium text-slate-600 border-b border-slate-100 focus:border-[#1e61f0] outline-none transition-colors"
                                            />
                                            <span className="text-slate-400 text-[12px]">%</span>
                                          </div>
                                        </td>
                                      )}
                                    </tr>
                                  ) : (
                                    <>
                                      {ranges.map((range, idx) => (
                                        <tr key={`${item.id}-${idx}`} className={`hover:bg-slate-50 transition-colors border-b border-slate-50 ${isSelected ? 'bg-blue-50/30' : ''}`}>
                                          {idx === 0 && formData.isBulkUpdateMode && (
                                            <td rowSpan={ranges.length + 1} className="px-4 py-3 border-r border-slate-50/50 align-top pt-4">
                                              <label className="flex items-center cursor-pointer group">
                                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-[#1e61f0] border-[#1e61f0]' : 'bg-white border-slate-300'}`}>
                                                  {isSelected && <Check size={10} color="white" strokeWidth={4} />}
                                                </div>
                                                <input 
                                                  type="checkbox" 
                                                  className="hidden" 
                                                  checked={isSelected} 
                                                  onChange={() => toggleItemSelection(item.id)} 
                                                />
                                              </label>
                                            </td>
                                          )}
                                          {idx === 0 && (
                                            <td rowSpan={ranges.length + 1} className={`px-4 py-3 text-[13px] font-bold text-slate-900 border-r border-slate-50 align-top pt-4 ${formData.isBulkUpdateMode ? '' : 'pl-4'}`}>{item.name}</td>
                                          )}
                                          {idx === 0 && (
                                            <td rowSpan={ranges.length + 1} className="px-4 py-3 text-[13px] text-slate-900 text-right font-medium border-r border-slate-50 align-top pt-4">₹{parseFloat((formData.transactionType === 'Sales' ? item.sellingPrice : item.costPrice) || 0).toLocaleString()}</td>
                                          )}
                                          <td className="px-4 py-2">
                                            <input 
                                              type="number"
                                              value={range.start}
                                              onChange={(e) => updateVolumeRange(item.id, idx, 'start', e.target.value)}
                                              className="w-full bg-transparent text-center text-[13px] outline-none focus:bg-blue-50 py-1 rounded"
                                            />
                                          </td>
                                          <td className="px-4 py-2">
                                            <input 
                                              type="number"
                                              placeholder="& up"
                                              value={range.end}
                                              onChange={(e) => updateVolumeRange(item.id, idx, 'end', e.target.value)}
                                              className="w-full bg-transparent text-center text-[13px] outline-none focus:bg-blue-50 py-1 rounded"
                                            />
                                          </td>
                                          <td className="px-4 py-2 text-right">
                                            <div className="flex items-center justify-end gap-1.5 ml-auto w-[120px]">
                                              <span className="text-slate-900 text-[12px]">₹</span>
                                              <input 
                                                type="number"
                                                placeholder="0.00"
                                                value={range.rate}
                                                onChange={(e) => updateVolumeRange(item.id, idx, 'rate', e.target.value)}
                                                className="w-full px-2 py-1 text-right text-[13px] font-bold text-slate-900 border-b border-slate-100 focus:border-[#1e61f0] outline-none transition-colors"
                                              />
                                              {ranges.length > 1 && (
                                                <button 
                                                  onClick={() => removeVolumeRange(item.id, idx)}
                                                  className="text-slate-300 hover:text-rose-500 ml-1 transition-colors"
                                                >
                                                  <X size={14} />
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                          {formData.includeDiscount && (
                                            <td className="px-4 py-2 text-right">
                                              <div className="flex items-center justify-end gap-1.5 ml-auto w-[100px]">
                                                <input 
                                                  type="number"
                                                  placeholder="0"
                                                  value={range.discount || ''}
                                                  onChange={(e) => updateVolumeRange(item.id, idx, 'discount', e.target.value)}
                                                  className="w-full px-2 py-1 text-right text-[13px] font-medium text-slate-600 border-b border-slate-100 focus:border-[#1e61f0] outline-none transition-colors"
                                                />
                                                <span className="text-slate-400 text-[12px]">%</span>
                                              </div>
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                      <tr className={isSelected ? 'bg-blue-50/30' : ''}>
                                        <td colSpan={formData.isBulkUpdateMode ? (formData.includeDiscount ? "5" : "4") : (formData.includeDiscount ? "4" : "3")} className="px-4 py-2">
                                          <button 
                                            onClick={() => addVolumeRange(item.id)}
                                            className="flex items-center gap-1.5 text-[#1e61f0] font-bold text-[11px] tracking-wider hover:opacity-80 transition-all ml-8"
                                          >
                                            <Plus size={12} strokeWidth={3} className="bg-[#1e61f0] text-white rounded-full p-0.5" />
                                            Add New Range
                                          </button>
                                        </td>
                                      </tr>
                                    </>
                                  )}
                                </React.Fragment>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={formData.pricingScheme === 'Volume Pricing' ? (formData.includeDiscount ? 7 : 6) : (formData.includeDiscount ? 5 : 4)} className="px-4 py-12 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <Database size={32} className="text-slate-200" />
                                  <div className="space-y-1">
                                    <p className="text-[13px] font-bold text-slate-400 tracking-tight">No items found in your inventory.</p>
                                    <p className="text-[11px] text-slate-400">Items you create in the Inventory module will appear here.</p>
                                  </div>
                                  <button 
                                    onClick={fetchItems}
                                    className="mt-2 flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded text-[11px] font-black text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                                  >
                                    <RefreshCw size={12} className={loadingItems ? 'animate-spin' : ''} />
                                    RETRY FETCHING
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="space-y-8 p-1 animate-fade-in">
                      {/* Export Section */}
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-[13px] font-black text-slate-900 tracking-tight">1. Export items as XLS file</h4>
                          <p className="text-[12px] text-slate-500 font-medium">Export all items or filter specific items, export them to an XLS file, update the rates, and import the file back to update the price list in Zoho Books.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={handleExportAll}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all bg-white shadow-sm"
                          >
                            <Download size={14} className="text-[#1e61f0]" />
                            Export All Items
                          </button>
                          <button 
                            onClick={handleExportFiltered}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all bg-white shadow-sm"
                          >
                            <Download size={14} className="text-[#1e61f0]" />
                            Export Filtered Items
                          </button>
                        </div>
                      </div>

                      {/* Import Section */}
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-[13px] font-black text-slate-900 tracking-tight">2. Import items as XLS file</h4>
                          <p className="text-[12px] text-slate-500 font-medium">Import the CSV or XLS file that you've exported and updated with the customised rates to update the price list.</p>
                        </div>
                        
                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
                          <div className="space-y-2">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">NOTE:</span>
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <span className="text-[12px] text-slate-600">1.</span>
                                <p className="text-[12px] text-slate-600">Before you import, ensure that the following column names are in English as given below:</p>
                              </div>
                              <ul className="pl-6 space-y-1 list-disc text-slate-500 text-[11px] font-medium leading-relaxed">
                                <li>Item Name</li>
                                <li>Start Quantity</li>
                                <li>End Quantity</li>
                                <li>PriceList Rate</li>
                              </ul>
                              <div className="flex gap-2 pt-1">
                                <span className="text-[12px] text-slate-600">2.</span>
                                <p className="text-[12px] text-slate-600">Once you import the file, the existing items and its rates in this price list will be replaced with the data in the import file.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={handleImportClick}
                          className="flex items-center gap-2 px-6 py-2.5 border border-slate-200 rounded-xl text-[12px] font-black text-slate-700 hover:bg-slate-50 transition-all bg-white shadow-sm"
                        >
                          <Upload size={16} className="text-[#1e61f0]" />
                          Import Items
                        </button>
                        
                        <input 
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                  )}
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
