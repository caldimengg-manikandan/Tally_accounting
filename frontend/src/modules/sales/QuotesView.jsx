import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ledgerAPI, quoteAPI } from '../../services/api';
import { 
  Plus, MoreHorizontal, ChevronDown, Settings, 
  X, Info, Upload as UploadIcon, Search, Tag, Paperclip, RefreshCw,
  Edit2, Trash2, ChevronRight, ArrowDownUp, Download, RotateCcw,
  ArrowUp, ArrowDown, ArrowLeft
} from 'lucide-react';

// ─────────────────────────────────────────────────
// MAIN ROUTER
// ─────────────────────────────────────────────────
const QuotesView = ({ companyId }) => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const isNew = location.pathname.includes('/new');
    const isEdit = location.pathname.includes('/edit');

    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQuotes = () => {
        setLoading(true);
        quoteAPI.getByCompany(companyId)
            .then(res => setQuotes(res.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!companyId) return;
        if (!isNew && !isEdit) {
            fetchQuotes();
        }
    }, [companyId, isNew, isEdit]);

    const handleDelete = async (quoteId) => {
        if (window.confirm('Are you sure you want to delete this quote?')) {
            try {
                await quoteAPI.delete(quoteId);
                fetchQuotes();
            } catch (err) {
                alert('Failed to delete quote');
            }
        }
    };

    if (isNew || isEdit) return <NewQuoteForm companyId={companyId} navigate={navigate} editId={id} />;

    // Auto-redirect to create form if no quotes exist yet
    if (!loading && quotes.length === 0) {
        navigate('/quotes/new', { replace: true });
        return null;
    }

    return <QuotesList quotes={quotes} loading={loading} navigate={navigate} onDelete={handleDelete} onRefresh={fetchQuotes} />;
};

// ─────────────────────────────────────────────────
// QUOTES LIST VIEW
// ─────────────────────────────────────────────────
const QuotesList = ({ quotes, loading, navigate, onDelete, onRefresh }) => {
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [activeSubMenu, setActiveSubMenu] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'quoteDate', direction: 'desc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
        setIsOptionsOpen(false);
    };

    const sortedQuotes = [...quotes].sort((a, b) => {
        let aValue = a[sortConfig.key] || '';
        let bValue = b[sortConfig.key] || '';
        if (sortConfig.key === 'totalAmount') {
           aValue = parseFloat(aValue || 0);
           bValue = parseFloat(bValue || 0);
        } else {
           aValue = String(aValue).toLowerCase();
           bValue = String(bValue).toLowerCase();
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const SortOption = ({ label, sortKey }) => {
        const isActive = sortConfig.key === sortKey;
        return (
           <div 
              onClick={(e) => { e.stopPropagation(); handleSort(sortKey); }}
              className={`px-4 py-2 cursor-pointer flex justify-between items-center rounded-sm mx-1 mt-1 ${isActive ? 'bg-[#1e61f0] text-white' : 'hover:bg-[#f4f5f7] text-slate-700'}`}
           >
              {label} 
              {isActive && (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
           </div>
        );
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
          setIsOptionsOpen(false);
          setActiveSubMenu(null);
        };
        if (isOptionsOpen) {
          document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isOptionsOpen]);

    if (loading) return (
        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
            <RefreshCw size={24} className="animate-spin text-[#1e61f0] mb-4" />
            <p className="text-slate-500 text-[14px]">Loading Quotes...</p>
        </div>
    );

    return (
        <div className="bg-white min-h-screen flex flex-col">
            <div className="flex items-center justify-between px-8 py-3 border-b border-slate-200 shadow-sm sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2 cursor-pointer px-2 py-1 bg-slate-50 border border-slate-200 rounded">
                    <h1 className="text-[17px] font-bold text-slate-800">All Quotes</h1>
                    <ChevronDown size={18} className="text-blue-500" />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/quotes/new')} className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-4 py-1.5 rounded-[4px] text-[13px] font-semibold flex items-center gap-1.5 shadow-sm transition-all">
                        <Plus size={16} strokeWidth={2.5}/> New
                    </button>
                    
                    <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIsOptionsOpen(!isOptionsOpen); }}
                          className={`p-1.5 h-8 border rounded-[4px] flex items-center shadow-sm transition-colors ${isOptionsOpen ? 'bg-slate-100 border-slate-400 text-slate-800' : 'bg-slate-50 border-slate-300 text-slate-500 hover:text-slate-700'}`}
                        >
                            <MoreHorizontal size={18} />
                        </button>

                        {isOptionsOpen && (
                          <div 
                            onClick={(e) => e.stopPropagation()} 
                            className="absolute right-0 top-full mt-2 w-[220px] bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 z-50 py-1 text-[13px] font-medium text-[#2c3e50] animate-fade-down origin-top-right whitespace-nowrap"
                          >
                             {/* SORT BY */}
                             <div 
                                className={`relative px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${activeSubMenu === 'sort' ? 'bg-[#f4f5f7]' : 'hover:bg-[#f4f5f7]'}`}
                                onMouseEnter={() => setActiveSubMenu('sort')}
                                onMouseLeave={() => setActiveSubMenu(null)}
                             >
                                <div className="flex items-center gap-3">
                                   <ArrowDownUp size={16} className="text-[#1e61f0]"/>
                                   <span>Sort by</span>
                                </div>
                                <ChevronRight size={14} className="text-[#1e61f0]" />
                                
                                {activeSubMenu === 'sort' && (
                                   <div className="absolute top-0 right-[calc(100%+4px)] w-[200px] bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-1 animate-fade-in text-[13px]">
                                      <SortOption label="Date" sortKey="quoteDate" />
                                      <SortOption label="Quote Number" sortKey="quoteNumber" />
                                      <SortOption label="Customer Name" sortKey="customerName" />
                                      <SortOption label="Amount" sortKey="totalAmount" />
                                      <SortOption label="Status" sortKey="status" />
                                   </div>
                                )}
                             </div>

                             {/* IMPORT */}
                             <div 
                                className={`relative px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${activeSubMenu === 'import' ? 'bg-[#1e61f0] text-white' : 'hover:bg-[#f4f5f7]'}`}
                                onMouseEnter={() => setActiveSubMenu('import')}
                                onMouseLeave={() => setActiveSubMenu(null)}
                             >
                                <div className="flex items-center gap-3">
                                   <Download size={16} className={activeSubMenu === 'import' ? 'text-white' : 'text-[#1e61f0]'}/>
                                   <span>Import</span>
                                </div>
                                <ChevronRight size={14} className={activeSubMenu === 'import' ? 'text-white' : 'text-[#1e61f0]'} />

                                {activeSubMenu === 'import' && (
                                   <div className="absolute top-0 right-[calc(100%+4px)] w-[180px] bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-1 animate-fade-in">
                                      <div className="px-4 py-2 bg-[#1e61f0] text-white cursor-pointer rounded-sm mx-1 text-[13px]">
                                         Import Quotes
                                      </div>
                                   </div>
                                )}
                             </div>

                             {/* EXPORT */}
                             <div 
                                className={`relative px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors border-b border-slate-100 pb-3 mb-1 ${activeSubMenu === 'export' ? 'bg-[#1e61f0] text-white' : 'hover:bg-[#f4f5f7]'}`}
                                onMouseEnter={() => setActiveSubMenu('export')}
                                onMouseLeave={() => setActiveSubMenu(null)}
                             >
                                <div className="flex items-center gap-3">
                                   <UploadIcon size={16} className={activeSubMenu === 'export' ? 'text-white' : 'text-[#1e61f0]'}/>
                                   <span>Export</span>
                                </div>
                                <ChevronRight size={14} className={activeSubMenu === 'export' ? 'text-white' : 'text-[#1e61f0]'} />
                             </div>

                             {/* Preferences */}
                             <div className="px-4 py-2.5 hover:bg-[#1e61f0] hover:text-white group cursor-pointer flex items-center gap-3 transition-colors">
                                <Settings size={16} className="text-[#1e61f0] group-hover:text-white"/>
                                 <span>Preferences</span>
                             </div>

                             {/* Refresh List */}
                             <div 
                                onClick={onRefresh}
                                className="px-4 py-2.5 hover:bg-[#1e61f0] hover:text-white group cursor-pointer flex items-center gap-3 transition-colors border-t border-slate-100 mt-1 pt-3"
                             >
                                <RefreshCw size={16} className="text-[#1e61f0] group-hover:text-white"/>
                                <span>Refresh List</span>
                             </div>

                             {/* Reset Column Width */}
                             <div className="px-4 py-2.5 hover:bg-[#1e61f0] hover:text-white group cursor-pointer flex items-center gap-3 transition-colors">
                                <RotateCcw size={16} className="text-[#1e61f0] group-hover:text-white"/>
                                <span>Reset Column Width</span>
                             </div>
                          </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quote List Implementation */}
            <div className="p-8">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Quote#</th>
                            <th className="px-6 py-4">Customer Name</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedQuotes.map(q => (
                            <tr key={q.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => navigate(`/quotes/edit/${q.id}`)}>
                                <td className="px-6 py-4 text-[14px] text-slate-600">
                                    {new Date(q.quoteDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </td>
                                <td className="px-6 py-4 text-[14px] font-medium text-slate-900">{q.quoteNumber}</td>
                                <td className="px-6 py-4 text-[14px] text-slate-700 font-semibold">{q.customerName}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                                        q.status === 'Sent' ? 'bg-blue-50 text-blue-600' : 
                                        q.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600' :
                                        q.status === 'Declined' ? 'bg-rose-50 text-rose-600' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                        {q.status || 'Draft'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-[14px] font-bold text-slate-900">
                                    ₹ {parseFloat(q.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); navigate(`/quotes/edit/${q.id}`); }}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded shadow-sm transition-all"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDelete(q.id); }}
                                            className="p-1.5 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded shadow-sm transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {quotes.length === 0 && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-fade-up">
                    <div className="mb-6 bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex items-center gap-4">
                       <div className="w-14 h-14 bg-green-50 rounded-full flex justify-center items-center">
                          <div className="w-10 h-10 bg-green-500 text-white rounded-full flex justify-center items-center text-[18px]">▶</div>
                       </div>
                       <div className="text-left py-2 pr-4">
                          <h4 className="font-bold text-slate-800 text-[15px] flex items-center gap-2">
                             <div className="w-5 h-5 bg-[#ffce00] text-slate-900 rounded font-black flex items-center justify-center text-[11px]">T</div> Tally Accounting
                          </h4>
                          <p className="text-[13px] text-slate-500">How to create a quote</p>
                       </div>
                    </div>
                    <h3 className="text-[20px] font-medium text-[#1a202c] mb-2">Seal the deal.</h3>
                    <p className="text-[#4a5568] text-[14px] mb-8">With quotes, give your customers an offer they can't refuse!</p>
                    <button onClick={() => navigate('/quotes/new')} className="bg-[#4885ed] text-white px-5 py-2.5 rounded-[4px] font-medium text-[13px] shadow-sm uppercase mb-4 hover:bg-[#3478e8] transition-all tracking-wide">
                        CREATE NEW QUOTE
                    </button>
                    <a href="#" className="text-[#4885ed] text-[13px] hover:underline font-medium">Import Quotes</a>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────
// QUOTE NUMBER SETTINGS MODAL
// ─────────────────────────────────────────────────
const QuoteNoSettingsModal = ({ quoteNo, onClose, onSave }) => {
    const [prefix, setPrefix] = useState('QT-');
    const [nextNum, setNextNum] = useState('000001');
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-[420px] p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-[16px] font-semibold text-slate-800">Quote Number Settings</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-[12px] text-slate-600 mb-1 block">Prefix</label>
                        <input value={prefix} onChange={e => setPrefix(e.target.value)} className="w-full border border-[#d1d5db] rounded-[4px] px-3 py-1.5 text-[13px] outline-none focus:border-[#4885ed]" />
                    </div>
                    <div>
                        <label className="text-[12px] text-slate-600 mb-1 block">Next Number</label>
                        <input value={nextNum} onChange={e => setNextNum(e.target.value)} className="w-full border border-[#d1d5db] rounded-[4px] px-3 py-1.5 text-[13px] outline-none focus:border-[#4885ed]" />
                    </div>
                    <div className="bg-slate-50 rounded-[4px] px-3 py-2 text-[13px] text-slate-600">
                        Preview: <span className="font-semibold text-slate-800">{prefix}{nextNum}</span>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-1.5 border border-slate-300 rounded-[4px] text-[13px] text-slate-600 hover:bg-slate-50">Cancel</button>
                    <button onClick={() => { onSave(`${prefix}${nextNum}`); onClose(); }} className="px-4 py-1.5 bg-[#4885ed] text-white rounded-[4px] text-[13px] hover:bg-[#3478e8]">Save</button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────
// NEW QUOTE FORM
// ─────────────────────────────────────────────────
const NewQuoteForm = ({ companyId, navigate, editId }) => {
    // Form State
    const [customerName, setCustomerName] = useState('');
    const [customers, setCustomers] = useState([]);
    const [quoteNo, setQuoteNo] = useState('QT-000001');
    const [showQuoteSettings, setShowQuoteSettings] = useState(false);
    const [refNo, setRefNo] = useState('');
    const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
    const [expiryDate, setExpiryDate] = useState('');
    const [salesperson, setSalesperson] = useState('');
    const [subject, setSubject] = useState('');
    const [taxType, setTaxType] = useState('TDS'); // TDS or TCS
    const [selectedTax, setSelectedTax] = useState('');
    const [attachedFiles, setAttachedFiles] = useState([]);
    const fileInputRef = useRef(null);
    
    const [items, setItems] = useState([{ id: 1, itemDetails: '', quantity: 1.00, rate: 0.00, amount: 0.00 }]);
    const [discount, setDiscount] = useState(0);
    const [adjustment, setAdjustment] = useState(0);
    const [customerNotes, setCustomerNotes] = useState('Looking forward for your business.');
    const [terms, setTerms] = useState('');

    // Fetch real customers
    useEffect(() => {
        if (!companyId) return;
        ledgerAPI.getByCompany(companyId)
            .then(res => setCustomers(res.data || []))
            .catch(console.error);
    }, [companyId]);

    // Fetch existing quote if editing
    useEffect(() => {
        if (editId) {
            quoteAPI.getById(editId).then(res => {
                const q = res.data;
                if (q) {
                    setCustomerName(q.customerName || '');
                    setQuoteNo(q.quoteNumber || '');
                    setRefNo(q.referenceNumber || '');
                    
                    if (q.quoteDate) {
                        const d = new Date(q.quoteDate);
                        if (!isNaN(d)) setQuoteDate(d.toISOString().split('T')[0]);
                    }
                    if (q.expiryDate) {
                        const d = new Date(q.expiryDate);
                        if (!isNaN(d)) setExpiryDate(d.toISOString().split('T')[0]);
                    }

                    setSalesperson(q.salesperson || '');
                    setSubject(q.subject || '');
                    
                    try {
                        const parsedItems = typeof q.itemsJson === 'string' ? JSON.parse(q.itemsJson) : q.itemsJson;
                        if (Array.isArray(parsedItems)) {
                            const itemsWithAmount = parsedItems.map(item => ({
                                ...item,
                                amount: item.amount || (parseFloat(item.quantity || 0) * parseFloat(item.rate || 0))
                            }));
                            setItems(itemsWithAmount.length > 0 ? itemsWithAmount : [{ id: 1, itemDetails: '', quantity: 1, rate: 0, amount: 0 }]);
                        }
                    } catch(e) {
                        console.error("Failed to parse itemsJson", e);
                    }

                    setDiscount(q.discount || 0);
                    setTaxType(q.taxType || 'TDS');
                    setSelectedTax(q.selectedTax || '');
                    setAdjustment(q.adjustment || 0);
                    setCustomerNotes(q.customerNotes || '');
                    setTerms(q.termsConditions || '');
                }
            }).catch(err => {
                console.error("Failed to fetch quote for editing", err);
            });
        }
    }, [editId]);

    // Tax options
    const TAX_OPTIONS = [
        { label: 'GST @ 5%', value: 'GST5', rate: 5 },
        { label: 'GST @ 12%', value: 'GST12', rate: 12 },
        { label: 'GST @ 18%', value: 'GST18', rate: 18 },
        { label: 'GST @ 28%', value: 'GST28', rate: 28 },
        { label: 'TDS @ 1%', value: 'TDS1', rate: 1 },
        { label: 'TDS @ 2%', value: 'TDS2', rate: 2 },
        { label: 'TDS @ 10%', value: 'TDS10', rate: 10 },
    ];
    const selectedTaxObj = TAX_OPTIONS.find(t => t.value === selectedTax);

    // Calculations
    const subTotal = items.reduce((acc, item) => acc + (parseFloat(item.quantity || 0) * parseFloat(item.rate || 0)), 0);
    const discountAmt = subTotal * (parseFloat(discount || 0) / 100);
    const taxAmt = selectedTaxObj ? ((subTotal - discountAmt) * selectedTaxObj.rate / 100) : 0;
    const total = subTotal - discountAmt - taxAmt + parseFloat(adjustment || 0);

    const handleSave = async () => {
        if (!customerName) { alert('Please select a customer.'); return; }
        try {
            const payload = {
                companyId,
                quoteNumber: quoteNo,
                customerName,
                referenceNumber: refNo,
                quoteDate,
                expiryDate: expiryDate || null,
                salesperson,
                subject,
                items,
                discount: parseFloat(discount || 0),
                taxType,
                selectedTax,
                taxAmount: taxAmt,
                adjustment: parseFloat(adjustment || 0),
                subTotal,
                totalAmount: total,
                customerNotes,
                termsConditions: terms
            };

            if (editId) {
                await quoteAPI.update(editId, payload);
            } else {
                await quoteAPI.create(payload);
            }
            navigate('/quotes');
        } catch(e) {
            alert('Failed to save quote: ' + (e.response?.data?.error || e.message));
        }
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        newItems[index].amount = parseFloat(newItems[index].quantity || 0) * parseFloat(newItems[index].rate || 0);
        setItems(newItems);
    };

    const removeItem = (index) => {
        if (items.length > 1) setItems(items.filter((_, i) => i !== index));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (attachedFiles.length + files.length > 5) {
            alert('You can upload a maximum of 5 files.');
            return;
        }
        setAttachedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index) => setAttachedFiles(prev => prev.filter((_, i) => i !== index));

    return (
        <div className="bg-white min-h-screen w-full relative">
            {showQuoteSettings && (
                <QuoteNoSettingsModal 
                    quoteNo={quoteNo} 
                    onClose={() => setShowQuoteSettings(false)} 
                    onSave={val => setQuoteNo(val)} 
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] sticky top-0 bg-white z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/quotes')}
                        className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                        title="Back to List"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <span className="text-[18px] text-[#1a202c] font-normal flex items-center gap-2">
                        <span className="text-slate-400">📄</span> {editId ? 'Edit Quote' : 'New Quote'}
                    </span>
                </div>
                <button onClick={() => navigate('/quotes')} className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded">
                    <X size={20} strokeWidth={2.5}/>
                </button>
            </div>

            <div className="px-8 py-6 max-w-[1100px]">
                {/* Metadata Grid */}
                <div className="grid grid-cols-12 gap-x-6 gap-y-5 max-w-[820px] mb-8">

                    {/* Customer Name - Smart Input */}
                    <div className="col-span-3 text-[13px] text-[#e53e3e] mt-2 font-medium">Customer Name*</div>
                    <div className="col-span-9">
                        <div className="flex gap-2">
                           <div className="relative flex-1">
                                <input 
                                    list="customer-list"
                                    value={customerName} 
                                    onChange={e => setCustomerName(e.target.value)}
                                    placeholder="Type or select a customer"
                                    className="w-full rounded-[4px] border border-[#d1d5db] px-3 py-1.5 focus:border-[#4885ed] outline-none text-[14px]"
                                />
                                <datalist id="customer-list">
                                    {customers.map(c => (
                                        <option key={c.id} value={c.name} />
                                    ))}
                                </datalist>
                           </div>
                            <button
                                type="button"
                                onClick={() => navigate('/customers/new')}
                                className="bg-[#4885ed] text-white px-3 rounded-[4px] shadow-sm hover:bg-[#3478e8] transition-colors"
                            >
                                <Plus size={14}/>
                            </button>
                        </div>
                    </div>

                    <div className="col-span-3 text-[13px] text-[#e53e3e] mt-2 font-medium">Quote#*</div>
                    <div className="col-span-9">
                        <div className="relative inline-block w-[300px]">
                            <input type="text" value={quoteNo} onChange={e => setQuoteNo(e.target.value)} className="w-full rounded-[4px] border border-[#d1d5db] px-3 py-1.5 text-[14px] outline-none pr-8 bg-[#f9fafb]" />
                            <button type="button" onClick={() => setShowQuoteSettings(true)}>
                                <Settings size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4885ed] cursor-pointer hover:rotate-45 transition-transform" />
                            </button>
                        </div>
                    </div>

                    <div className="col-span-3 text-[13px] text-slate-700 mt-2">Reference#</div>
                    <div className="col-span-9">
                        <input type="text" value={refNo} onChange={e => setRefNo(e.target.value)} className="w-[300px] rounded-[4px] border border-[#d1d5db] px-3 py-1.5 text-[14px] outline-none focus:border-[#4885ed]" />
                    </div>

                    <div className="col-span-3 text-[13px] text-[#e53e3e] mt-2 font-medium">Quote Date*</div>
                    <div className="col-span-9 flex items-center gap-4">
                        <input type="date" value={quoteDate} onChange={e => setQuoteDate(e.target.value)} className="w-[180px] rounded-[4px] border border-[#d1d5db] px-3 py-1.5 text-[14px] outline-none focus:border-[#4885ed]" />
                        <span className="text-[13px] text-slate-700 mx-2">Expiry Date</span>
                        <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-[180px] rounded-[4px] border border-[#d1d5db] px-3 py-1.5 text-[14px] outline-none focus:border-[#4885ed]" />
                    </div>

                    <div className="col-span-12 border-b border-slate-100 my-1"></div>

                    <div className="col-span-3 text-[13px] text-slate-700 mt-2">Salesperson</div>
                    <div className="col-span-9">
                        <select value={salesperson} onChange={e => {
                            if (e.target.value === '__create__') { navigate('/customers/new'); return; }
                            setSalesperson(e.target.value);
                        }} className="w-[300px] rounded-[4px] border border-[#d1d5db] px-3 py-1.5 text-[14px] outline-none text-slate-500 bg-white">
                            <option value="">Select or Add Salesperson</option>
                            <option disabled>──────────────</option>
                            <option value="__create__" className="text-[#4885ed] font-medium">+ Create New Salesperson</option>
                        </select>
                    </div>

                    <div className="col-span-3 text-[13px] text-slate-700 mt-2">Project Name</div>
                    <div className="col-span-9">
                        <select className="w-[300px] rounded-[4px] border border-[#d1d5db] px-3 py-1.5 text-[14px] outline-none text-slate-500 bg-white">
                            <option value="">Select a project</option>
                        </select>
                        <p className="text-[11px] text-slate-400 mt-1">Select a customer to associate a project.</p>
                    </div>

                    <div className="col-span-12 border-b border-slate-100 my-1"></div>

                    <div className="col-span-3 text-[13px] text-slate-700 mt-2 flex items-center gap-2">
                        Subject <Info size={13} className="text-slate-400" />
                    </div>
                    <div className="col-span-9">
                        <textarea value={subject} onChange={e => setSubject(e.target.value)} rows="1" placeholder="Let your customer know what this Quote is for" className="w-[450px] rounded-[4px] border border-[#d1d5db] px-3 py-2 text-[14px] outline-none focus:border-[#4885ed] resize-none" />
                    </div>
                </div>

                {/* ITEM TABLE */}
                <div className="mb-6 border border-[#d1d5db] rounded-t-md overflow-hidden">
                    <div className="bg-slate-50 px-3 py-2 border-b border-[#d1d5db] flex justify-between items-center">
                        <h4 className="text-[14px] font-medium text-slate-800">Item Table</h4>
                        <button className="text-[#4885ed] text-[13px] flex items-center gap-1 font-medium hover:underline">
                            <RefreshCw size={13}/> Bulk Actions
                        </button>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#d1d5db] text-[#4a5568] text-[11px] font-bold uppercase tracking-wider bg-slate-50">
                                <th className="px-3 py-2 w-8"></th>
                                <th className="px-4 py-2 border-r border-[#e2e8f0]">ITEM DETAILS</th>
                                <th className="px-4 py-2 text-right border-r border-[#e2e8f0] w-28">QUANTITY</th>
                                <th className="px-4 py-2 text-right border-r border-[#e2e8f0] w-28">RATE</th>
                                <th className="px-4 py-2 text-right w-28">AMOUNT</th>
                                <th className="w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item.id} className="border-b border-[#e2e8f0] group bg-white">
                                    <td className="text-center px-2 cursor-grab text-slate-300 text-[16px]">⋮⋮</td>
                                    <td className="border-r border-[#e2e8f0]">
                                        <input type="text" value={item.itemDetails} onChange={e => updateItem(index, 'itemDetails', e.target.value)} placeholder="Type or click to select an item." className="w-full px-4 py-2 text-[13px] outline-none bg-transparent" />
                                    </td>
                                    <td className="border-r border-[#e2e8f0]">
                                        <input type="number" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} className="w-full px-4 py-2 text-[13px] text-right outline-none bg-transparent" />
                                    </td>
                                    <td className="border-r border-[#e2e8f0]">
                                        <input type="number" value={item.rate} onChange={e => updateItem(index, 'rate', e.target.value)} className="w-full px-4 py-2 text-[13px] text-right outline-none bg-transparent" />
                                    </td>
                                    <td className="px-4 py-2 text-[13px] text-right font-medium text-slate-800">
                                        {(parseFloat(item.amount || 0)).toFixed(2)}
                                    </td>
                                    <td className="text-center px-2">
                                        <button onClick={() => removeItem(index)} className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all"><X size={14}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-4 py-3 border-t border-[#d1d5db] bg-slate-50">
                        <button className="flex items-center gap-1.5 text-[13px] text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-[4px] hover:bg-slate-50 font-medium">
                            <Tag size={13} className="text-slate-400"/> Reporting Tags <ChevronDown size={13}/>
                        </button>
                    </div>
                    <div className="flex px-4 py-3 gap-3">
                        <button onClick={() => setItems([...items, { id: Date.now(), itemDetails: '', quantity: 1.00, rate: 0.00, amount: 0.00 }])} className="flex items-center gap-1 bg-[#eef3ff] hover:bg-[#dce9ff] text-[#4885ed] px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors">
                            <Plus size={14}/> Add New Row
                        </button>
                        <button className="flex items-center gap-1 bg-[#eef3ff] hover:bg-[#dce9ff] text-[#4885ed] px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors">
                            <Plus size={14}/> Add Items in Bulk
                        </button>
                    </div>
                </div>

                <div className="flex gap-10 flex-wrap">
                    <div className="flex-1 min-w-[280px] space-y-6">
                        <div>
                            <label className="text-[13px] text-slate-700 mb-1 block">Customer Notes</label>
                            <textarea value={customerNotes} onChange={e => setCustomerNotes(e.target.value)} rows="3" className="w-full max-w-[420px] border border-[#d1d5db] rounded-[4px] p-2 text-[13px] outline-none focus:border-[#4885ed] resize-none"/>
                        </div>
                        <div>
                            <label className="text-[13px] text-slate-700 mb-1 block">Terms & Conditions</label>
                            <textarea value={terms} onChange={e => setTerms(e.target.value)} placeholder="Enter the terms and conditions of your business to be displayed in your transaction" rows="4" className="w-full max-w-[420px] border border-[#d1d5db] rounded-[4px] p-2 text-[13px] outline-none focus:border-[#4885ed] resize-none"/>
                        </div>
                    </div>

                    <div className="w-[420px] bg-slate-50 p-6 rounded-md border border-[#e2e8f0] self-start">
                        <div className="flex justify-between text-[13px] text-slate-800 mb-4 font-medium">
                            <span>Sub Total</span>
                            <span>{subTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[13px] items-center mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-slate-600">Discount</span>
                                <div className="flex border border-[#d1d5db] rounded-[4px] overflow-hidden bg-white w-[90px]">
                                    <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(e.target.value)} className="w-full outline-none px-2 py-1 text-right text-[13px]" />
                                    <span className="bg-slate-100 text-slate-500 px-2 py-1 border-l border-[#d1d5db] text-[12px]">%</span>
                                </div>
                            </div>
                            <span className="text-slate-800 font-medium">{discountAmt.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[13px] items-center mb-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" name="taxType" checked={taxType === 'TDS'} onChange={() => { setTaxType('TDS'); setSelectedTax(''); }} className="accent-[#4885ed] w-3 h-3"/>
                                        <span className="text-[12px]">TDS</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" name="taxType" checked={taxType === 'TCS'} onChange={() => { setTaxType('TCS'); setSelectedTax(''); }} className="accent-[#4885ed] w-3 h-3"/>
                                        <span className="text-[12px]">TCS</span>
                                    </label>
                                </div>
                                <select value={selectedTax} onChange={e => setSelectedTax(e.target.value)} className="border border-[#d1d5db] rounded-[4px] outline-none px-2 py-1 text-[12px] w-[140px] bg-white focus:border-[#4885ed]">
                                    <option value="">Select a Tax</option>
                                    {TAX_OPTIONS.filter(t => taxType === 'TDS' ? t.value.startsWith('TDS') || t.value.startsWith('GST') : t.value.startsWith('GST')).map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <span className="text-slate-800 font-medium">- {taxAmt.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[13px] items-center mb-6">
                            <div className="flex items-center gap-3">
                                <span className="text-slate-500 border border-dashed border-[#d1d5db] px-2 py-1 rounded-[4px] text-[12px]">Adjustment</span>
                                <input type="number" value={adjustment} onChange={e => setAdjustment(e.target.value)} className="border border-[#d1d5db] rounded-[4px] outline-none px-2 py-1 text-[13px] w-[80px] bg-white focus:border-[#4885ed]" />
                                <Info size={13} className="text-slate-400" />
                            </div>
                            <span className="text-slate-800 font-medium">{parseFloat(adjustment || 0).toFixed(2)}</span>
                        </div>
                        <div className="border-t border-[#d1d5db] pt-4 flex justify-between font-bold text-[16px] text-slate-900">
                            <span>Total ( ₹ )</span>
                            <span>{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6">
                    <label className="text-[13px] text-slate-700 font-medium block mb-2">Attach File(s) to Quote</label>
                    <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        accept="*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 text-[13px] bg-white border border-slate-300 rounded-[4px] px-3 py-1.5 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <UploadIcon size={14} className="text-slate-500" /> Upload File
                    </button>
                    <p className="text-[11px] text-slate-400 mt-1.5">You can upload a maximum of 5 files, 10MB each</p>
                    {attachedFiles.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                            {attachedFiles.map((file, i) => (
                                <div key={i} className="flex items-center gap-2 text-[12px] text-slate-700 bg-blue-50 border border-blue-100 rounded px-3 py-1.5 group w-fit">
                                    <Paperclip size={12} className="text-[#4885ed]"/>
                                    <span>{file.name}</span>
                                    <span className="text-slate-400 ml-1">({(file.size / 1024).toFixed(1)} KB)</span>
                                    <button onClick={() => removeFile(i)} className="ml-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-6 flex items-center gap-2">
                    <input type="checkbox" className="accent-[#4885ed] w-3 h-3 rounded" />
                    <span className="text-[12px] text-slate-700">Create a retainer invoice for this quote automatically</span>
                    <Info size={13} className="text-slate-400" />
                </div>

                <div className="mt-8 flex items-center gap-3 border-t border-slate-200 pt-6 pb-10">
                    <button onClick={() => handleSave()} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-5 py-2 rounded-[4px] text-[13px] font-medium transition-colors">
                        {editId ? 'Update Quote' : 'Save as Draft'}
                    </button>
                    {!editId && (
                        <button onClick={() => handleSave()} className="bg-[#4885ed] text-white hover:bg-[#3478e8] px-5 py-2 rounded-[4px] text-[13px] font-medium shadow-sm transition-colors">
                            Save and Send
                        </button>
                    )}
                    <button onClick={() => navigate('/quotes')} className="text-slate-600 hover:text-slate-800 px-4 py-2 rounded-[4px] text-[13px] font-medium transition-colors hover:bg-slate-50">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuotesView;
