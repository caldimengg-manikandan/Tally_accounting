import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ledgerAPI, quoteAPI, companyAPI, priceListAPI, projectAPI } from '../../services/api';
import { 
  Plus, MoreHorizontal, ChevronDown, Settings, 
  X, Info, Upload, Search, Tag, Paperclip, RefreshCw,
  Edit2, Trash2, ChevronRight, ArrowDownUp, Download, RotateCcw,
  ArrowUp, ArrowDown, ArrowLeft, FileText, Building, Package, Check,
  Mail, Phone, Send, HelpCircle, ShieldCheck, Loader2, User, Printer,
  History, Share2, List, DollarSign, ArrowRight, CheckCircle2, AlertCircle, Clock,
  Calendar, Save
} from 'lucide-react';
import { inventoryAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';
import EmailSendModal from '../../components/EmailSendModal';
import ConfirmModal from '../../components/ConfirmModal';

// ─────────────────────────────────────────────────
// UTILS: NUMBER TO WORDS
// ─────────────────────────────────────────────────
const numberToWords = (num) => {
    if (num === 0) return "Zero";
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    
    const convert = (n) => {
        let str = "";
        if (n >= 100000) {
            str += convert(Math.floor(n / 100000)) + " Lakh ";
            n %= 100000;
        }
        if (n >= 1000) {
            str += convert(Math.floor(n / 1000)) + " Thousand ";
            n %= 1000;
        }
        if (n >= 100) {
            str += convert(Math.floor(n / 100)) + " Hundred ";
            n %= 100;
        }
        if (n >= 20) {
            str += tens[Math.floor(n / 10)] + " ";
            str += ones[n % 10];
        } else if (n >= 10) {
            str += teens[n - 10];
        } else {
            str += ones[n];
        }
        return str.trim();
    };
    return convert(num);
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER SEARCH SELECTOR
// ─────────────────────────────────────────────────────────────────────────────
const CustomerSearchSelector = ({ value, onChange, customers, placeholder, onNewCustomer }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = (customers || []).filter(c => {
        return c.name?.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div className="relative w-full" ref={containerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded flex items-center justify-between cursor-pointer hover:border-blue-400 focus-within:border-blue-400 transition-all shadow-sm group"
            >
                <div className="flex-1 overflow-hidden">
                    {value ? (
                        <div className="text-[13px] font-bold text-slate-800 tracking-tight truncate">{value}</div>
                    ) : (
                        <div className="text-[13px] font-bold text-slate-400">{placeholder}</div>
                    )}
                </div>
                <ChevronDown size={14} className={`text-slate-400 group-hover:text-blue-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 shadow-2xl rounded-lg z-[100] overflow-hidden animate-fade-in flex flex-col">
                    <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search customers..."
                                className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded text-[12px] outline-none focus:border-blue-500 transition-all font-bold shadow-sm"
                            />
                        </div>
                    </div>
                    <div className="max-h-[250px] overflow-y-auto no-scrollbar py-1">
                        {filtered.length > 0 ? (
                            filtered.map(c => (
                                <div 
                                    key={c.id}
                                    onClick={() => { onChange(c.id); setIsOpen(false); setSearch(''); }}
                                    className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors group mx-1 rounded flex items-center gap-3"
                                >
                                    <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                        <User size={12} />
                                    </div>
                                    <div className="text-[13px] font-bold text-slate-800 tracking-tight">{c.name}</div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center flex flex-col items-center justify-center">
                                <User size={20} className="text-slate-300 mb-2" />
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">No customers found</p>
                            </div>
                        )}
                    </div>
                    <div className="border-t border-slate-100 p-2 bg-slate-50 shrink-0">
                        <button 
                            onClick={() => { setIsOpen(false); onNewCustomer(); }}
                            className="w-full flex items-center justify-center gap-2 py-2 text-blue-600 font-bold text-[12px] hover:bg-blue-100 rounded transition-colors border border-blue-200"
                        >
                            <Plus size={14} strokeWidth={3} /> New Customer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// ITEM SEARCH SELECTOR (FOR TABLE CELLS)
// ─────────────────────────────────────────────────────────────────────────────
const ItemSearchSelector = ({ value, onChange, items, placeholder, onNewItem }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = (items || []).filter(it => {
        const n = it.name || '';
        const d = it.salesDescription || '';
        const s = search.toLowerCase();
        return n.toLowerCase().includes(s) || d.toLowerCase().includes(s);
    });

    return (
        <div className="relative w-full" ref={containerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded flex items-center justify-between cursor-pointer hover:border-blue-400 focus-within:border-blue-400 transition-all shadow-sm group"
            >
                <div className="flex-1 overflow-hidden">
                    {value ? (
                        <div className="text-[13px] font-bold text-slate-800 tracking-tight truncate">{value}</div>
                    ) : (
                        <div className="text-[13px] font-bold text-slate-400">{placeholder}</div>
                    )}
                </div>
                <ChevronDown size={14} className={`text-slate-400 group-hover:text-blue-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[400px] bg-white border border-slate-200 shadow-2xl rounded-lg z-[100] overflow-hidden animate-fade-in flex flex-col">
                    <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search items..."
                                className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded text-[12px] outline-none focus:border-blue-500 transition-all font-bold shadow-sm"
                            />
                        </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto no-scrollbar py-1">
                        {filtered.length > 0 ? (
                            filtered.map(it => (
                                <div 
                                    key={it.id}
                                    onClick={() => { onChange(it); setIsOpen(false); setSearch(''); }}
                                    className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors group mx-1 rounded"
                                >
                                    <div className="flex justify-between items-start mb-0.5">
                                        <div className="text-[13px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                            <Package size={14} className="text-blue-500 opacity-50" /> {it.name}
                                        </div>
                                        <div className="text-[12px] font-bold text-slate-900 tabular-nums">₹{parseFloat(it.sellingPrice || 0).toLocaleString()}</div>
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-bold whitespace-nowrap overflow-hidden text-ellipsis italic pl-6">
                                        {it.salesDescription || 'No description provided'}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center flex flex-col items-center justify-center">
                                <Package size={20} className="text-slate-300 mb-2" />
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">No matching items</p>
                            </div>
                        )}
                    </div>
                    <div className="border-t border-slate-100 p-2 bg-slate-50 shrink-0">
                        <button 
                            onClick={() => { setIsOpen(false); onNewItem(); }}
                            className="w-full flex items-center justify-center gap-2 py-2 text-blue-600 font-bold text-[12px] hover:bg-blue-100 rounded transition-colors border border-blue-200"
                        >
                            <Plus size={14} strokeWidth={3} /> New Item
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────
// BULK ITEM SELECTOR MODAL
// ─────────────────────────────────────────────────
const BulkItemSelectorModal = ({ isOpen, onClose, onAdd, items }) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [search, setSearch] = useState('');

    const safeItems = Array.isArray(items) ? items : [];

    if (!isOpen) return null;

    const filtered = safeItems.filter(it => 
        (it.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (it.salesDescription && it.salesDescription.toLowerCase().includes(search.toLowerCase()))
    );

    const toggleItem = (id) => {
        const idStr = String(id);
        setSelectedIds(prev => prev.includes(idStr) ? prev.filter(i => i !== idStr) : [...prev, idStr]);
    };

    const handleConfirm = () => {
        const selectedItems = safeItems.filter(it => selectedIds.includes(String(it.id)));
        console.log("BULK ADD CONFIRMED:", selectedItems);
        onAdd(selectedItems);
        setSelectedIds([]);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.2)] w-full max-w-2xl overflow-hidden animate-scale-up flex flex-col max-h-[85vh]">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Bulk Item Selection</h3>
                        <p className="text-[13px] text-slate-500 font-medium">Select multiple products or services from your inventory.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm"><X size={24}/></button>
                </div>

                <div className="p-6 bg-white border-b border-slate-50">
                    <div className="relative">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={safeItems.length === 0 ? "Loading inventory..." : "Find items..."}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl text-[15px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-2 no-scrollbar">
                    {safeItems.length === 0 ? (
                        <div className="py-20 text-center opacity-40">
                             <Package size={48} className="mx-auto mb-4 animate-bounce" />
                             <p className="font-bold uppercase tracking-widest text-[11px]">Synching Inventory...</p>
                        </div>
                    ) : filtered.length > 0 ? (
                        filtered.map(it => {
                            const isPicked = selectedIds.includes(String(it.id));
                            return (
                                <div 
                                    key={it.id}
                                    onClick={() => toggleItem(it.id)}
                                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-5 group
                                        ${isPicked ? 'bg-blue-50/50 border-blue-500 shadow-lg shadow-blue-500/5' : 'bg-white border-slate-50 hover:border-slate-200'}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
                                        ${isPicked ? 'bg-blue-600 text-white rotate-12 scale-110 shadow-lg shadow-blue-600/30' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'}`}>
                                        {isPicked ? <Check size={20} strokeWidth={3} /> : <Package size={20} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[15px] font-bold tracking-tight ${isPicked ? 'text-blue-700' : 'text-slate-800'}`}>{it.name}</span>
                                            <span className={`text-[15px] font-bold ${isPicked ? 'text-blue-900' : 'text-slate-900'}`}>₹{parseFloat(it.sellingPrice || 0).toLocaleString()}</span>
                                        </div>
                                        <p className="text-[12px] text-slate-400 font-medium truncate italic">{it.salesDescription || 'Sync description field...'}</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search size={24} className="text-slate-300" />
                            </div>
                            <h4 className="text-slate-900 font-bold text-lg mb-1">No matches found</h4>
                            <p className="text-slate-400 font-medium text-[13px]">Try a different keyword or filter.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 flex items-center justify-between px-8 py-6 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-white rounded-full border border-slate-200 text-[12px] font-bold text-slate-600 shadow-sm uppercase tracking-widest">
                            {selectedIds.length} Items Selected
                        </div>
                        {selectedIds.length > 0 && (
                            <button onClick={() => setSelectedIds([])} className="text-[11px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors">Clear All</button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[13px] font-bold hover:bg-slate-100 transition-all uppercase tracking-widest">Discard</button>
                        <button 
                            disabled={selectedIds.length === 0}
                            onClick={handleConfirm}
                            className="px-10 py-3 bg-blue-600 text-white rounded-xl text-[13px] font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all uppercase tracking-widest disabled:opacity-50 disabled:shadow-none"
                        >
                            Import Selected
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────
// CONFIRMATION MODAL
// ─────────────────────────────────────────────────
const DeleteConfirmModal = ({ isOpen, onConfirm, onCancel, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300" style={{ paddingLeft: 'var(--sidebar-width, 0px)' }}>
            <div className="absolute inset-x-0 inset-y-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" style={{ left: 'var(--sidebar-width, 0px)' }} onClick={onCancel} />
            <div className="relative bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-md overflow-hidden animate-scale-up">
                <div className="p-8">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-6">
                        <Trash2 className="text-red-600" size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">{title}</h3>
                    <p className="text-slate-500 text-[14px] leading-relaxed font-medium">
                        {message}
                    </p>
                </div>
                <div className="p-4 bg-slate-50 flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={onCancel}
                        className="flex-1 py-3 px-6 bg-white border border-slate-200 text-slate-600 rounded-xl text-[13px] font-bold hover:bg-slate-100 transition-all uppercase tracking-widest"
                    >
                        CANCEL
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="flex-1 py-3 px-6 bg-red-600 text-white rounded-xl text-[13px] font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all uppercase tracking-widest"
                    >
                        DELETE NOW
                    </button>
                </div>
            </div>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-[420px] p-6 animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[18px] font-bold text-slate-900 italic tracking-tighter uppercase">Quote Configuration</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20}/></button>
                </div>
                <div className="space-y-5">
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Numbering Prefix</label>
                        <input value={prefix} onChange={e => setPrefix(e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-[14px] font-bold outline-none focus:border-[#1e61f0] transition-colors" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Starting Sequence</label>
                        <input value={nextNum} onChange={e => setNextNum(e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-[14px] font-bold outline-none focus:border-[#1e61f0] transition-colors" />
                    </div>
                    <div className="bg-slate-50 rounded p-4 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Live Sequence Preview</p>
                        <span className="font-bold text-[#1e61f0] text-[18px] italic tracking-tighter">{prefix}{nextNum}</span>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={onClose} className="px-6 py-2 border border-slate-200 rounded text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">Discard</button>
                    <button onClick={() => { onSave(`${prefix}${nextNum}`); onClose(); }} className="px-6 py-2 bg-[#1e61f0] text-white rounded text-[13px] font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all uppercase tracking-widest">Apply Format</button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────
// QUOTES LIST VIEW (SIDEBAR STYLE)
// ─────────────────────────────────────────────────
const QuotesList = ({ quotes, loading, navigate, onDelete, onRefresh, selectedId, onSelect }) => {
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'quoteDate', direction: 'desc' });
    const isSplit = Boolean(selectedId);

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

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className={`flex items-center justify-between px-8 py-4 border-b border-slate-100 ${isSplit ? 'hidden' : ''}`}>
                <div className="flex items-center gap-2 group cursor-pointer">
                    <h1 className="text-[20px] font-bold text-slate-900">All Quotes</h1>
                    <ChevronDown size={18} className="text-blue-600 mt-1" />
                </div>
                <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigate('/quotes/new')} 
                      className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-4 py-2 rounded-md font-medium flex items-center gap-1.5 transition-all shadow-sm"
                    >
                        <Plus size={18} strokeWidth={2.5} /> New Quote
                    </button>
                    <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIsOptionsOpen(!isOptionsOpen); }}
                          className="p-2 text-slate-500 hover:text-slate-800 border border-slate-200 bg-white rounded-md hover:bg-slate-50 transition-colors shadow-sm"
                        >
                           <MoreHorizontal size={18} />
                        </button>
                        {isOptionsOpen && (
                          <div className="absolute right-0 top-full mt-2 w-[220px] bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 z-50 py-1 text-[13px] font-medium text-[#2c3e50] animate-fade-down origin-top-right">
                                <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">Sort By</div>
                                <SortOption label="Quote Number" sortKey="quoteNumber" />
                                <SortOption label="Date" sortKey="quoteDate" />
                                <SortOption label="Customer Name" sortKey="customerName" />
                                <SortOption label="Amount" sortKey="totalAmount" />
                                <div className="mt-2 pt-2 border-t border-slate-50">
                                   <div onClick={() => { setIsOptionsOpen(false); onRefresh(); }} className="px-4 py-2 hover:bg-[#f4f5f7] cursor-pointer text-slate-700 flex items-center gap-2 font-medium text-[13px]"><RefreshCw size={14}/> Refresh List</div>
                                </div>
                          </div>
                        )}
                    </div>
                </div>
            </div>

            {isSplit && (
                <div className="p-4 flex items-center justify-between border-b border-slate-100">
                    <h1 className="text-[18px] font-bold text-slate-900">Quotes</h1>
                    <button onClick={() => navigate('/quotes/new')} className="bg-[#1e61f0] text-white px-3 py-1.5 rounded-md text-[12px] font-bold hover:bg-[#1a54d1] transition-all">
                        <Plus size={16} /> New
                    </button>
                </div>
            )}

            <div className={`flex-1 overflow-y-auto no-scrollbar relative ${isSplit ? '' : 'p-8'}`}>
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-60 opacity-50">
                        <RefreshCw className="animate-spin text-[#1e61f0] mb-2" size={24} />
                        <span className="text-[12px] font-medium tracking-widest uppercase font-bold">Syncing...</span>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Customer Details</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedQuotes.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                <Tag size={24} />
                                            </div>
                                            <p className="text-slate-500 text-[14px]">No quotes found.</p>
                                            <button onClick={() => navigate('/quotes/new')} className="text-blue-600 text-[13px] font-medium hover:underline">Add your first quote</button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedQuotes.map(q => (
                                    <tr 
                                        key={q.id} 
                                        onClick={() => onSelect(q.id)}
                                        className={`hover:bg-slate-50 transition-colors cursor-pointer group ${String(q.id) === String(selectedId) ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <td className="px-6 py-4 text-[13px] text-slate-500 font-medium whitespace-nowrap">
                                            {new Date(q.quoteDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[14px] font-medium text-blue-600 group-hover:underline truncate max-w-[250px]">
                                                {q.customerName}
                                            </div>
                                            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">#{q.quoteNumber}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <span className="text-[14px] text-slate-900 font-medium">
                                                ₹ {parseFloat(q.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold tracking-widest border ${q.status === 'Accepted' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                {q.status || 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/quotes/edit/${q.id}`); }} 
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded shadow-sm transition-all text-[12px] font-medium"
                                                >
                                                    <Edit2 size={13} /> Edit
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onDelete(q.id); }} 
                                                    className="flex items-center justify-center p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded shadow-sm transition-all"
                                                    title="Delete Quote"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────
// QUOTE DETAIL VIEW
// ─────────────────────────────────────────────────
const QuoteDetailView = ({ quoteId, companyId, navigate }) => {
    const [quote, setQuote] = useState(null);
    const [currentCompany, setCurrentCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('detail'); // 'detail' or 'email'

    useEffect(() => {
        if (!quoteId || !companyId) return;
        setLoading(true);
        Promise.all([
            quoteAPI.getById(quoteId),
            companyAPI.getById(companyId)
        ])
            .then(([quoteRes, companyRes]) => {
                setQuote(quoteRes.data);
                setCurrentCompany(companyRes.data);
            })
            .catch(err => {
                console.error(err);
                setQuote(null);
            })
            .finally(() => setLoading(false));
    }, [quoteId, companyId]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 text-center animate-pulse">
            <RefreshCw className="animate-spin mb-4 text-[#1e61f0]" size={32} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[12px]">Hydrating Document...</p>
        </div>
    );

    if (!quote) return (
        <div className="flex flex-col items-center justify-center p-20 text-center h-full">
            <X size={48} className="text-red-200 mb-4" />
            <p className="text-slate-500 font-medium italic">Document expired or not found.</p>
        </div>
    );

    if (view === 'email') {
        return (
            <EmailSendModal 
                isOpen={true}
                onClose={() => setView('detail')}
                documentData={{
                    id: quote.id,
                    number: quote.quoteNumber,
                    customerName: quote.customerName,
                    Customer: quote.Customer
                }}
                documentType="Quote"
                onSend={() => navigate('/quotes')}
                apiFunc={quoteAPI.sendEmail}
            />
        );
    }

    const items = typeof quote.itemsJson === 'string' ? JSON.parse(quote.itemsJson) : (quote.itemsJson || []);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f8fafc] animate-fade-in shadow-inner overflow-hidden">
            <div className="bg-[#fcfdfe] border-b border-slate-200 px-8 py-2.5 flex items-center justify-between sticky top-0 z-10 no-print">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/quotes')} className="text-[13px] font-bold text-blue-600 hover:underline flex items-center gap-1.5 transition-all">
                       <ChevronDown size={14} className="rotate-90"/> All Proposals
                    </button>
                    <span className="text-slate-300">|</span>
                    <span className="text-[13px] font-bold text-slate-800">{quote.quoteNumber}</span>
                </div>
                <div className="flex items-center gap-3">
                   <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-none transition-all hover:text-slate-600"><History size={16}/></button>
                   <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-none transition-all hover:text-slate-600"><Share2 size={16}/></button>
                </div>
            </div>

            <div className="bg-white border-b border-slate-100 px-8 py-2 flex items-center justify-between shadow-sm no-print">
                <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/quotes/edit/${quote.id}`)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded-none flex items-center gap-1.5 text-[12px] font-bold border border-transparent hover:border-slate-100 transition-all"><Edit2 size={14}/> Edit</button>
                    <button onClick={() => window.print()} className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded-none flex items-center gap-1.5 text-[12px] font-bold transition-all"><Printer size={14}/> PDF/Print <ChevronDown size={14}/></button>
                    <span className="w-px h-5 bg-slate-100 mx-2" />
                    <button 
                        onClick={() => navigate('/sales-invoices/new', { state: { quoteData: quote } })}
                        className="px-4 py-1.5 bg-emerald-600 text-white rounded-none flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/10"
                    >
                        <CheckCircle2 size={14}/> Convert to Invoice
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-12 flex flex-col items-center custom-scrollbar print:p-0 print:bg-white transition-all bg-slate-50/50">
                <div id="printable-quote" className="bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] rounded-none min-h-[842px] w-full max-w-[800px] mx-auto p-8 md:p-20 relative overflow-hidden border border-slate-100 mb-20 group">
                    {/* Professional Watermark */}
                    <div className="absolute -top-10 -right-10 w-96 h-96 bg-blue-50/30 rounded-none blur-[100px] pointer-events-none -z-10"></div>
                    <div className="absolute top-16 right-16 rotate-[12deg] opacity-[0.03] no-print pointer-events-none select-none">
                        <div className="border-[12px] border-slate-900 text-slate-900 px-12 py-6 text-7xl font-bold uppercase tracking-[0.2em] rounded-none">OFFICIAL</div>
                    </div>

                    <div className="flex justify-between items-start mb-16 border-b border-slate-900 pb-12">
                        <div className="flex gap-4 items-start max-w-[65%]">
                            <div className="w-12 h-12 bg-slate-900 flex items-center justify-center text-white font-bold text-xl shrink-0 rounded-none">{currentCompany?.name?.charAt(0) || 'M'}</div>
                            <div className="space-y-1 min-w-0">
                                <h2 className="text-[18px] font-bold text-slate-900 tracking-tight uppercase leading-tight">{currentCompany?.name || 'THE MOON ENTERPRISES'}</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Sales & Estimation Department</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-[18px] font-bold text-slate-900 tracking-[0.2em] uppercase leading-none mb-3">QUOTE</h1>
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Quote Ref #</p>
                                <p className="text-[15px] font-bold text-slate-900 tracking-tight">{quote.quoteNumber}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-20 mb-16">
                        <div className="space-y-4">
                            <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Estimate Prepared For</h5>
                            <div className="space-y-1">
                                <p className="text-[15px] font-bold text-slate-900 leading-tight">{quote.customerName}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ref: {quote.referenceNumber || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="text-right space-y-4">
                            <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Date of Quote</h5>
                            <p className="text-[15px] font-bold text-slate-900 leading-tight">{new Date(quote.quoteDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>

                    <div className="relative mb-20">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-[3px] border-slate-900 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900">
                                    <th className="py-6 text-left pb-4">Service / Item Details</th>
                                    <th className="py-6 text-right w-24 pb-4">Qty</th>
                                    <th className="py-6 text-right w-32 pb-4">Unit Rate</th>
                                    <th className="py-6 text-right w-40 pb-4">Total Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((it, idx) => (
                                    <tr key={idx} className="group/row hover:bg-slate-50/50 transition-colors">
                                        <td className="py-8">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 bg-slate-50 flex items-center justify-center text-slate-400 group-hover/row:bg-white group-hover/row:text-blue-500 transition-all border border-transparent group-hover/row:border-blue-100 font-bold text-[12px] rounded-none">{idx + 1}</div>
                                                <div>
                                                    <p className="text-[16px] font-bold text-slate-900 tracking-tight mb-1">{it.itemDetails}</p>
                                                    <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wide leading-relaxed max-w-xs">{it.description || 'General Service Provision'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-8 text-right text-[15px] font-bold text-slate-500 tabular-nums">{it.quantity}</td>
                                        <td className="py-8 text-right text-[15px] font-bold text-slate-500 tabular-nums">₹{parseFloat(it.rate).toLocaleString()}</td>
                                        <td className="py-8 text-right text-[16px] font-bold text-slate-900 tabular-nums">₹{parseFloat(it.amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end pt-12 border-t-2 border-slate-900">
                        <div className="w-full max-w-md space-y-6">
                            <div className="flex justify-between items-center px-2">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Estimate Subtotal</span>
                                <span className="text-[16px] font-bold text-slate-600 tabular-nums">₹{parseFloat(quote.subTotal).toLocaleString()}</span>
                            </div>
                            {parseFloat(quote.taxAmount || 0) > 0 && (
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Tax ({quote.selectedTax})</span>
                                    <span className="text-[16px] font-bold text-slate-600 tabular-nums">₹{parseFloat(quote.taxAmount).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="bg-slate-900 text-white p-6 md:p-8 shadow-2xl relative overflow-hidden rounded-none">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-none blur-[60px] opacity-20"></div>
                                <div className="flex justify-between items-center relative z-10">
                                    <span className="text-[11px] font-bold text-blue-300 uppercase tracking-[0.2em]">Grand Total</span>
                                    <span className="text-[24px] md:text-[32px] font-bold text-white tracking-tighter tabular-nums">₹{parseFloat(quote.totalAmount).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-32 flex justify-between items-end opacity-40">
                         <div className="space-y-1">
                             <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Validated Proposal</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Doc-Hash: {quote.id?.substring(0, 12)}...</p>
                         </div>
                         <div className="text-right">
                             <div className="w-32 h-0.5 bg-slate-900 mb-2 ml-auto"></div>
                             <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Authorized Signature</p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Replaced by unified EmailSendModal

// ─────────────────────────────────────────────────
// MANAGE SALESPERSONS MODAL
// ─────────────────────────────────────────────────
const ManageSalespersonsModal = ({ isOpen, onClose, salespersons, onSave, onSelect }) => {
    const [search, setSearch] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');

    if (!isOpen) return null;

    const filtered = salespersons.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
    );

    const handleSaveAndSelect = () => {
        if (!newName.trim()) return;
        const entry = { id: Date.now(), name: newName.trim(), email: newEmail.trim() };
        const updated = [...salespersons, entry];
        localStorage.setItem('tally_salespersons', JSON.stringify(updated));
        onSave(updated);
        onSelect(entry.name);
        setNewName('');
        setNewEmail('');
        setShowAddForm(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.2)] w-full max-w-lg overflow-hidden animate-scale-up">
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Manage Salespersons</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"><X size={18}/></button>
                </div>

                {/* Search + New Button */}
                <div className="px-6 py-4 flex items-center gap-3 border-b border-slate-100">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search Salesperson"
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-[13px] font-medium outline-none focus:border-blue-500 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-4 py-2 bg-[#1e61f0] text-white text-[13px] font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-blue-100"
                    >
                        <Plus size={14}/> New Salesperson
                    </button>
                </div>

                {/* Inline Add Form */}
                {showAddForm && (
                    <div className="mx-6 my-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[11px] font-bold text-red-500 uppercase tracking-widest mb-1.5">Name*</label>
                                <input
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="w-full h-9 px-3 border border-slate-300 rounded text-[13px] font-medium outline-none focus:border-blue-500 bg-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-red-500 uppercase tracking-widest mb-1.5">Email*</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                    className="w-full h-9 px-3 border border-slate-300 rounded text-[13px] font-medium outline-none focus:border-blue-500 bg-white transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSaveAndSelect}
                                disabled={!newName.trim()}
                                className="px-5 py-2 bg-[#1e61f0] text-white text-[12px] font-bold rounded hover:bg-blue-700 transition-all disabled:opacity-40 shadow-sm"
                            >
                                Save and Select
                            </button>
                            <button
                                onClick={() => { setShowAddForm(false); setNewName(''); setNewEmail(''); }}
                                className="px-5 py-2 bg-white border border-slate-200 text-slate-600 text-[12px] font-bold rounded hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="px-6">
                    <div className="grid grid-cols-2 py-3 border-b border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Salesperson Name</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</span>
                    </div>
                    <div className="max-h-56 overflow-y-auto no-scrollbar">
                        {filtered.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-[13px] font-medium italic">No salespersons found.</div>
                        ) : (
                            filtered.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => { onSelect(s.name); onClose(); }}
                                    className="grid grid-cols-2 py-3 border-b border-slate-50 hover:bg-blue-50 cursor-pointer rounded transition-colors"
                                >
                                    <span className="text-[13px] font-bold text-[#1e61f0]">{s.name}</span>
                                    <span className="text-[13px] text-slate-500 font-medium">{s.email || '—'}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="px-6 py-4" />
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────
// NEW QUOTE FORM
// ─────────────────────────────────────────────────
const NewQuoteForm = ({ companyId, navigate, editId }) => {
    const addNotification = useNotificationStore(state => state.addNotification);
    const [customerName, setCustomerName] = useState('');
    const [customers, setCustomers] = useState([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickAddForm, setQuickAddForm] = useState({ name: '', email: '', mobile: '', salutation: 'Mr.' });
    const [isSavingCustomer, setIsSavingCustomer] = useState(false);
    const customerDropdownRef = useRef(null);
    const salespersonDropdownRef = useRef(null);
    const [quoteNo, setQuoteNo] = useState('QT-000001');
    const [showQuoteSettings, setShowQuoteSettings] = useState(false);
    const [refNo, setRefNo] = useState('');
    const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
    const [expiryDate, setExpiryDate] = useState('');
    const [salesperson, setSalesperson] = useState('');
    const [salespersons, setSalespersons] = useState(() => {
        try { return JSON.parse(localStorage.getItem('tally_salespersons') || '[]'); } catch { return []; }
    });
    const [showSalespersonDropdown, setShowSalespersonDropdown] = useState(false);
    const [salespersonSearch, setSalespersonSearch] = useState('');
    const [showManageSalespersons, setShowManageSalespersons] = useState(false);
    const [projectId, setProjectId] = useState('');
    const [projects, setProjects] = useState([]);
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);
    const [projectSearch, setProjectSearch] = useState('');
    const projectDropdownRef = useRef(null);
    const [priceList, setPriceList] = useState('');
    const [subject, setSubject] = useState('');
    const [selectedTax, setSelectedTax] = useState('');
    const [attachedFiles, setAttachedFiles] = useState([]);
    const fileInputRef = useRef(null);
    
    const [items, setItems] = useState([{ id: Date.now(), itemDetails: '', quantity: 1.00, rate: 0.00, amount: 0.00 }]);
    const [discount, setDiscount] = useState(0);
    const [adjustment, setAdjustment] = useState(0);
    const [terms, setTerms] = useState('');
    const [customerNotes, setCustomerNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', showCancel: false, confirmText: 'OK' });
    const location = useLocation();

    const [inventoryItems, setInventoryItems] = useState([]);
    const [priceLists, setPriceLists] = useState([]);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isPriceListDropdownOpen, setIsPriceListDropdownOpen] = useState(false);
    const [priceListSearch, setPriceListSearch] = useState('');
    const [customerLedgerId, setCustomerLedgerId] = useState('');
    const priceListRef = useRef(null);

    useEffect(() => {
        if (!editId) {
            try {
                const draft = localStorage.getItem('quote_draft');
                if (draft) {
                    const parsed = JSON.parse(draft);
                    if (parsed.customerName) { setCustomerName(parsed.customerName); setCustomerSearch(parsed.customerName); }
                    if (parsed.quoteNo) setQuoteNo(parsed.quoteNo);
                    if (parsed.refNo) setRefNo(parsed.refNo);
                    if (parsed.quoteDate) setQuoteDate(parsed.quoteDate);
                    if (parsed.expiryDate) setExpiryDate(parsed.expiryDate);
                    if (parsed.salesperson) setSalesperson(parsed.salesperson);
                    if (parsed.subject) setSubject(parsed.subject);
                    if (parsed.discount) setDiscount(parsed.discount);
                    if (parsed.adjustment) setAdjustment(parsed.adjustment);
                    if (parsed.selectedTax) setSelectedTax(parsed.selectedTax);
                    if (parsed.customerNotes) setCustomerNotes(parsed.customerNotes);
                    if (parsed.terms) setTerms(parsed.terms);
                    if (parsed.items) setItems(parsed.items);
                    if (parsed.projectId) setProjectId(parsed.projectId);
                    localStorage.removeItem('quote_draft');
                }
            } catch(e) {}
        }
    }, [editId]);

    const bulkFileRef = useRef(null);

    const handleBulkImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = evt.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            const newItems = jsonData.map((row, idx) => {
                const name = row['Item Name'] || row['Item'] || row['item'] || row['Name'] || '';
                const qty = parseFloat(row['Quantity'] || row['Qty'] || row['qty'] || 1);
                const rate = parseFloat(row['Price'] || row['Rate'] || row['price'] || row['rate'] || 0);
                
                return {
                    id: Date.now() + idx,
                    itemDetails: name,
                    quantity: qty,
                    rate: rate,
                    amount: qty * rate
                };
            }).filter(item => item.itemDetails);

            if (newItems.length > 0) {
                setItems(newItems);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleBulkAdd = (selectedItems) => {
        const mapped = selectedItems.map(it => ({
            id: Date.now() + Math.random(),
            itemDetails: it.name,
            quantity: 1,
            rate: it.sellingPrice || 0,
            amount: it.sellingPrice || 0
        }));
        setItems(prev => {
            const filtered = prev.filter(item => item.itemDetails.trim() !== '' || item.rate > 0);
            return [...filtered, ...mapped];
        });
    };

    const handleQuickAdd = async () => {
        if (!quickAddForm.name) return;
        setIsSavingCustomer(true);
        try {
            const activeCoId = companyId || localStorage.getItem('companyId');
            const res = await ledgerAPI.create({
                companyId: activeCoId,
                name: quickAddForm.name,
                email: quickAddForm.email,
                phone: quickAddForm.mobile,
                salutation: quickAddForm.salutation,
                groupName: 'Sundry Debtors' 
            });
            setCustomers(prev => [...prev, res.data]);
            setCustomerName(res.data.name);
            setCustomerSearch(res.data.name);
            setIsQuickAddOpen(false);
            setQuickAddForm({ name: '', email: '', mobile: '', salutation: 'Mr.' });
            addNotification('Customer added successfully!', 'success');
        } catch (err) {
            console.error(err);
            addNotification('Failed to register customer', 'error');
        } finally {
            setIsSavingCustomer(false);
        }
    };

    const TAX_OPTIONS = [
        { label: 'GST @ 5%', value: 'GST5', rate: 5 },
        { label: 'GST @ 12%', value: 'GST12', rate: 12 },
        { label: 'GST @ 18%', value: 'GST18', rate: 18 },
        { label: 'GST @ 28%', value: 'GST28', rate: 28 },
    ];
    const selectedTaxObj = TAX_OPTIONS.find(t => t.value === selectedTax);
    const subTotal = items.reduce((acc, item) => acc + (parseFloat(item.quantity || 0) * parseFloat(item.rate || 0)), 0);
    const discountAmt = subTotal * (parseFloat(discount || 0) / 100);
    const taxAmt = selectedTaxObj ? ((subTotal - discountAmt) * selectedTaxObj.rate / 100) : 0;
    const total = subTotal - discountAmt + taxAmt + parseFloat(adjustment || 0);

    useEffect(() => {
        const activeCoId = companyId || localStorage.getItem('companyId');
        if (!activeCoId) return;
        
        Promise.all([
            ledgerAPI.getByCompany(activeCoId),
            inventoryAPI.getByCompany(activeCoId),
            priceListAPI.getByCompany(activeCoId),
            projectAPI.getByCompany(activeCoId).catch(() => ({ data: [] }))
        ])
        .then(([ledgersRes, invRes, priceRes, projRes]) => {
            const allLedgers = ledgersRes.data || [];
            setCustomers(allLedgers.filter(l => {
                const g = l.Group?.name || '';
                return g.toLowerCase().includes('debtor') || g.toLowerCase().includes('customer');
            }));
            setInventoryItems(invRes.data || []);
            setPriceLists(priceRes.data || []);
            setProjects(projRes.data || []);
        })
        .catch(err => console.error("DATA HYDRATION FAILED:", err));
    }, [companyId]);

    useEffect(() => {
        if (location.state?.customerId && customers.length > 0) {
            const found = customers.find(c => String(c.id) === String(location.state.customerId));
            if (found) {
                setCustomerName(found.name);
                setCustomerSearch(found.name);
            }
        }
    }, [location.state?.customerId, customers]);

    useEffect(() => {
        if (editId) {
            quoteAPI.getById(editId).then(res => {
                const q = res.data;
                if (q) {
                    setCustomerName(q.customerName || '');
                    setQuoteNo(q.quoteNumber || '');
                    setRefNo(q.referenceNumber || '');
                    if (q.quoteDate) setQuoteDate(new Date(q.quoteDate).toISOString().split('T')[0]);
                    if (q.expiryDate) setExpiryDate(new Date(q.expiryDate).toISOString().split('T')[0]);
                    setSalesperson(q.salesperson || '');
                    setSubject(q.subject || '');
                    setDiscount(q.discount || 0);
                    setAdjustment(q.adjustment || 0);
                    setSelectedTax(q.selectedTax || '');
                    setCustomerNotes(q.customerNotes || '');
                    setTerms(q.termsConditions || '');
                    if (q.itemsJson) {
                        setItems(typeof q.itemsJson === 'string' ? JSON.parse(q.itemsJson) : q.itemsJson);
                    }
                    if (q.ProjectId) setProjectId(q.ProjectId);
                }
            });
        }
    }, [editId]);

    useEffect(() => {
        if (!priceList || items.length === 0) return;
        const selectedList = priceLists.find(p => p.id === priceList);
        if (!selectedList) return;

        const percentage = parseFloat(selectedList.percentage) || 0;
        const isMarkup = selectedList.markupType === 'Markup';

        const updatedItems = items.map(item => {
            const invItem = inventoryItems.find(i => i.name === item.itemDetails);
            const baseRate = invItem ? parseFloat(invItem.sellingPrice || 0) : parseFloat(item.rate || 0);
            
            let newRate = baseRate;
            if (isMarkup) {
                newRate = baseRate + (baseRate * percentage / 100);
            } else {
                newRate = baseRate - (baseRate * percentage / 100);
            }

            return {
                ...item,
                rate: newRate,
                amount: newRate * (parseFloat(item.quantity) || 0)
            };
        });

        setItems(updatedItems);
    }, [priceList]);

    const handleSave = async () => {
        const missingFields = [];
        if (!customerName) missingFields.push('Customer Name');
        if (!quoteNo) missingFields.push('Quote Number');
        if (!quoteDate) missingFields.push('Quote Date');
        
        const validItems = items.filter(it => it.itemDetails && it.itemDetails.trim() !== '' && it.rate > 0);
        if (validItems.length === 0) {
            setModalConfig({
                isOpen: true,
                title: 'No Items Added',
                message: 'Please add at least one item with a valid name and rate before confirming the quote.',
                type: 'warning',
                showCancel: false,
                confirmText: 'Understood'
            });
            return;
        }

        if (missingFields.length > 0) {
            setModalConfig({
                isOpen: true,
                title: 'Data Required',
                message: `The following fields are mandatory: ${missingFields.join(', ')}. Please fill them to proceed.`,
                type: 'danger',
                showCancel: false,
                confirmText: 'Review Form'
            });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                companyId,
                quoteNumber: quoteNo,
                customerName,
                customerLedgerId,
                referenceNumber: refNo,
                quoteDate,
                expiryDate: expiryDate || null,
                salesperson,
                subject,
                items,
                discount: parseFloat(discount || 0),
                selectedTax,
                taxAmount: taxAmt,
                adjustment: parseFloat(adjustment || 0),
                subTotal,
                totalAmount: total,
                customerNotes,
                termsConditions: terms,
                projectId
            };

            if (editId) {
                await quoteAPI.update(editId, payload);
            } else {
                await quoteAPI.create(payload);
            }
            navigate('/quotes');
        } catch (err) {
            console.error(err);
            addNotification('Failed to save quote', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] relative">
            <BulkItemSelectorModal 
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onAdd={handleBulkAdd}
                items={inventoryItems} />
            
            {/* Form Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-20 no-print">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/quotes')}
                        className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 transition-all"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            {editId ? 'Edit Quote' : 'Create Quote'}
                            <span className="text-[10px] font-bold text-[#1e61f0] bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest border border-blue-100">{quoteNo}</span>
                        </h2>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sales / Quotes</div>
                    </div>
                </div>
                <button onClick={() => navigate('/quotes')} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="max-w-[1000px] mx-auto py-10 px-6">
                    <div className="bg-white rounded border border-slate-200 shadow-sm p-12 space-y-12 animate-fade-in">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 mb-8">
                                <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-widest">Primary Details</h3>
                                <div className="h-px bg-slate-100 flex-1"></div>
                            </div>

                            <div className="flex items-center relative z-20">
                                <label className="w-48 text-[11px] font-bold text-rose-500 uppercase tracking-widest shrink-0">Customer Name*</label>
                                <div className="flex-1 max-w-2xl">
                                    <CustomerSearchSelector 
                                        value={customerName}
                                        onChange={(id) => {
                                            const c = customers.find(x => x.id === id);
                                            if (c) {
                                                setCustomerName(c.name);
                                                setCustomerLedgerId(c.id);
                                            }
                                        }}
                                        customers={customers}
                                        placeholder="Search or select customer..."
                                        onNewCustomer={() => {
                                            localStorage.setItem('quote_draft', JSON.stringify({
                                                customerName, quoteNo, refNo, quoteDate, expiryDate, salesperson, subject, discount, adjustment, selectedTax, customerNotes, terms, items, projectId
                                            }));
                                            window.open('/ledger/new', '_blank');
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <label className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest shrink-0">Quote Reference</label>
                                <div className="flex-1 max-w-2xl relative">
                                    <input 
                                        value={quoteNo}
                                        readOnly
                                        className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded text-[13px] font-bold text-slate-400 outline-none cursor-not-allowed shadow-sm"
                                    />
                                    <button onClick={() => setShowQuoteSettings(true)} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 p-1 hover:bg-blue-50 rounded transition-all">
                                        <Settings size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <label className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest shrink-0">Reference Number</label>
                                <div className="flex-1 max-w-2xl">
                                    <input 
                                        value={refNo} 
                                        onChange={e => setRefNo(e.target.value)} 
                                        placeholder="e.g. PO-89021"
                                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded text-[13px] font-bold text-slate-900 outline-none focus:border-blue-500 transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <label className="w-48 text-[11px] font-bold text-rose-500 uppercase tracking-widest shrink-0">Quote Date*</label>
                                <div className="flex-1 max-w-2xl relative">
                                    <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input 
                                        type="date" 
                                        value={quoteDate} 
                                        onChange={e => setQuoteDate(e.target.value)} 
                                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded text-[13px] font-bold text-slate-900 outline-none focus:border-blue-500 transition-all pr-10 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <label className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest shrink-0">Expiry Date</label>
                                <div className="flex-1 max-w-2xl relative">
                                    <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input 
                                        type="date" 
                                        value={expiryDate} 
                                        onChange={e => setExpiryDate(e.target.value)} 
                                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded text-[13px] font-bold text-slate-900 outline-none focus:border-blue-500 transition-all pr-10 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center relative z-10" ref={salespersonDropdownRef}>
                                <label className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest shrink-0">Salesperson</label>
                                <div className="flex-1 max-w-2xl relative">
                                    <input 
                                        type="text"
                                        value={salespersonSearch || salesperson}
                                        onChange={(e) => { setSalespersonSearch(e.target.value); setShowSalespersonDropdown(true); }}
                                        onFocus={() => setShowSalespersonDropdown(true)}
                                        placeholder="Assign staff..."
                                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded text-[13px] font-bold text-slate-900 outline-none focus:border-blue-500 transition-all shadow-sm"
                                    />
                                    {showSalespersonDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-2xl rounded-lg z-[120] overflow-hidden">
                                            <div className="max-h-56 overflow-y-auto no-scrollbar">
                                                {salespersons.filter(s => s.name.toLowerCase().includes(salespersonSearch.toLowerCase())).map(s => (
                                                    <div 
                                                        key={s.id} 
                                                        onClick={() => { setSalesperson(s.name); setSalespersonSearch(s.name); setShowSalespersonDropdown(false); }}
                                                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-[13px] font-bold text-slate-700 border-b border-slate-50 last:border-0"
                                                    >
                                                        {s.name}
                                                    </div>
                                                ))}
                                                <div 
                                                    onClick={() => setShowManageSalespersons(true)}
                                                    className="px-4 py-3 bg-slate-50 hover:bg-[#1e61f0] text-[#1e61f0] hover:text-white font-bold text-[11px] uppercase tracking-widest cursor-pointer transition-all flex items-center gap-2"
                                                >
                                                    <Settings size={14} /> Manage Salespersons
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center relative z-[5]" ref={projectDropdownRef}>
                                <label className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest shrink-0">Project</label>
                                <div className="flex-1 max-w-2xl relative">
                                    <input 
                                        type="text"
                                        value={projectSearch || projects.find(p => p.id === projectId)?.name || ''}
                                        onChange={(e) => { setProjectSearch(e.target.value); setShowProjectDropdown(true); }}
                                        onFocus={() => setShowProjectDropdown(true)}
                                        placeholder="Link to project..."
                                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded text-[13px] font-bold text-slate-900 outline-none focus:border-blue-500 transition-all shadow-sm"
                                    />
                                    {showProjectDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-2xl rounded-lg z-[120] overflow-hidden">
                                            <div className="max-h-56 overflow-y-auto no-scrollbar">
                                                {projects.filter(p => (p.name||'').toLowerCase().includes(projectSearch.toLowerCase())).map(p => (
                                                    <div 
                                                        key={p.id} 
                                                        onClick={() => { setProjectId(p.id); setProjectSearch(p.name); setShowProjectDropdown(false); }}
                                                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-[13px] font-bold text-slate-700 border-b border-slate-50 last:border-0"
                                                    >
                                                        {p.name}
                                                    </div>
                                                ))}
                                                <div 
                                                    onClick={() => {
                                                        localStorage.setItem('quote_draft', JSON.stringify({
                                                            customerName, quoteNo, refNo, quoteDate, expiryDate, salesperson, subject, discount, adjustment, selectedTax, customerNotes, terms, items, projectId
                                                        }));
                                                        setShowProjectDropdown(false); 
                                                        window.open('/time-tracking/projects/new', '_blank');
                                                    }}
                                                    className="px-4 py-3 bg-slate-50 hover:bg-[#1e61f0] text-[#1e61f0] hover:text-white font-bold text-[11px] uppercase tracking-widest cursor-pointer transition-all flex items-center gap-2"
                                                >
                                                    <Plus size={14} /> Add New Project
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start pt-8 mt-8 border-t border-slate-100">
                             <label className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest shrink-0 mt-3">Subject</label>
                             <div className="flex-1 max-w-2xl">
                                 <textarea 
                                    value={subject} 
                                    onChange={e => setSubject(e.target.value)} 
                                    placeholder="Enter a brief summary of the proposal"
                                    className="w-full h-20 p-3 bg-white border border-slate-200 rounded text-[13px] font-medium text-slate-900 outline-none focus:border-blue-500 transition-all resize-none shadow-sm"
                                 />
                             </div>
                        </div>

                        <div className="flex items-center pt-8 mt-8 border-t border-slate-100 relative z-[4]" ref={priceListRef}>
                            <label className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest shrink-0">Price List</label>
                            <div className="flex-1 max-w-2xl relative">
                                <div 
                                    onClick={() => setIsPriceListDropdownOpen(!isPriceListDropdownOpen)}
                                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded flex items-center justify-between cursor-pointer hover:border-blue-400 transition-all shadow-sm group"
                                >
                                    <div className="flex items-center gap-2 text-[13px] font-bold text-slate-700">
                                        <FileText size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                        <span>{priceList ? priceLists.find(p => p.id === priceList)?.name || 'Select Price List' : 'Select Price List'}</span>
                                    </div>
                                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isPriceListDropdownOpen ? 'rotate-180' : ''}`} />
                                </div>
                                {isPriceListDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-2xl rounded-lg z-[100] overflow-hidden animate-scale-up">
                                        <div className="p-2 border-b border-slate-50">
                                            <div className="relative">
                                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="text"
                                                    value={priceListSearch}
                                                    onChange={e => setPriceListSearch(e.target.value)}
                                                    placeholder="Search price lists..."
                                                    className="w-full pl-9 pr-4 py-1.5 bg-slate-50 rounded text-[12px] font-bold outline-none focus:bg-white focus:ring-1 focus:ring-blue-100 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto no-scrollbar">
                                        {priceLists.filter(p => !priceListSearch || p.name.toLowerCase().includes(priceListSearch.toLowerCase())).length > 0 ? (
                                            priceLists.filter(p => !priceListSearch || p.name.toLowerCase().includes(priceListSearch.toLowerCase())).map(p => (
                                                <div 
                                                    key={p.id}
                                                    onClick={() => {
                                                        setPriceList(p.id);
                                                        setIsPriceListDropdownOpen(false);
                                                    }}
                                                    className={`px-4 py-3 cursor-pointer transition-all border-b border-slate-50/50 last:border-0 hover:bg-blue-50 ${priceList === p.id ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                                                >
                                                    <p className="text-[13px] font-bold">{p.name}</p>
                                                    <p className={`text-[10px] uppercase font-bold tracking-[0.2em] mt-0.5 ${priceList === p.id ? 'text-blue-200' : 'text-slate-400'}`}>
                                                        {p.percentage ? `${p.percentage}% ${p.type === 'Markup' ? 'Markup' : 'Markdown'}` : 'Standard Pricing'}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center">
                                                <FileText size={24} className="mx-auto text-slate-200 mb-2" />
                                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">No lists found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                        <div className="space-y-4 pt-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-widest">Item Table</h3>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setIsBulkModalOpen(true)} className="text-[11px] font-bold text-blue-600 flex items-center gap-2 hover:bg-blue-50 px-3 py-1.5 rounded transition-all border border-blue-200">
                                        <Package size={14} /> Bulk Add
                                    </button>
                                </div>
                            </div>
                            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                                            <th className="px-6 py-4 text-left">Item Details</th>
                                            <th className="px-6 py-4 text-right w-28">Quantity</th>
                                            <th className="px-6 py-4 text-right w-36">Rate</th>
                                            <th className="px-6 py-4 text-right w-40">Amount</th>
                                            <th className="w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {items.map((line, idx) => (
                                            <tr key={line.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-5">
                                                    <ItemSearchSelector 
                                                        items={inventoryItems}
                                                        value={line.itemDetails}
                                                        onChange={(selected) => {
                                                            const updated = [...items];
                                                            updated[idx].itemDetails = selected.name;
                                                            updated[idx].rate = selected.sellingPrice || 0;
                                                            updated[idx].amount = (parseFloat(updated[idx].quantity) || 0) * (selected.sellingPrice || 0);
                                                            setItems(updated);
                                                        }}
                                                        placeholder="Type to select item..."
                                                        onNewItem={() => {
                                                            localStorage.setItem('quote_draft', JSON.stringify({
                                                                customerName, quoteNo, refNo, quoteDate, expiryDate, salesperson, subject, discount, adjustment, selectedTax, customerNotes, terms, items, project
                                                            }));
                                                            window.open('/inventory/new', '_blank');
                                                        }}
                                                    />
                                                    <div className="text-[11px] text-slate-400 pl-4 mt-1 font-bold uppercase tracking-tight opacity-60">
                                                        {inventoryItems.find(i => i.name === line.itemDetails)?.salesDescription || 'General Service Item'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 align-top tabular-nums">
                                                    <input 
                                                        type="number" 
                                                        value={line.quantity} 
                                                        onChange={e => {
                                                            const updated = [...items];
                                                            updated[idx].quantity = e.target.value;
                                                            updated[idx].amount = (parseFloat(e.target.value) || 0) * (parseFloat(updated[idx].rate) || 0);
                                                            setItems(updated);
                                                        }} 
                                                        className="w-full text-right bg-transparent border-none outline-none text-[13px] font-bold text-slate-600 focus:bg-white rounded transition-all" 
                                                    />
                                                </td>
                                                <td className="px-6 py-5 align-top font-mono tabular-nums">
                                                    <input 
                                                        type="number" 
                                                        value={line.rate} 
                                                        onChange={e => {
                                                            const updated = [...items];
                                                            updated[idx].rate = e.target.value;
                                                            updated[idx].amount = (parseFloat(e.target.value) || 0) * (parseFloat(updated[idx].quantity) || 0);
                                                            setItems(updated);
                                                        }} 
                                                        className="w-full text-right bg-transparent border-none outline-none text-[13px] font-bold text-slate-600 focus:bg-white rounded transition-all" 
                                                    />
                                                </td>
                                                <td className="px-6 py-5 text-right align-top">
                                                    <span className="text-[13px] font-bold text-slate-900 tabular-nums">₹{parseFloat(line.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </td>
                                                <td className="px-4 py-5 text-center align-top">
                                                    <button onClick={() => setItems(items.filter(it => it.id !== line.id))} className="text-slate-300 hover:text-red-500 transition-colors">
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex items-center gap-3 mt-4">
                                <button onClick={() => setItems([...items, { id: Date.now(), itemDetails: '', quantity: 1, rate: 0, amount: 0 }])} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-[12px] font-bold rounded hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all uppercase tracking-widest">
                                    <Plus size={14} strokeWidth={3}/> Add Row
                                </button>
                                <div className="ml-auto flex items-center gap-4 text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] pl-8 border-l border-slate-200">
                                    <input type="file" ref={bulkFileRef} onChange={handleBulkImport} className="hidden" accept=".xlsx,.xls"/>
                                    <button onClick={() => bulkFileRef.current.click()} className="hover:text-blue-600 transition-colors flex items-center gap-2"><Upload size={14} /> CSV Import</button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-start pt-12 border-t border-slate-100 gap-20">
                           <div className="flex-1 max-w-md space-y-8">
                              <div className="space-y-3">
                                 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Customer Notes</label>
                                 <textarea 
                                    value={customerNotes} 
                                    onChange={e => setCustomerNotes(e.target.value)} 
                                    placeholder="Will be displayed on the proposal"
                                    className="w-full h-24 p-3 bg-white border border-slate-200 rounded text-[13px] font-medium text-slate-900 outline-none focus:border-blue-500 transition-all resize-none shadow-sm" 
                                 />
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Terms & Conditions</label>
                                 <textarea 
                                   value={terms} 
                                   onChange={e => setTerms(e.target.value)} 
                                   placeholder="Business terms..." 
                                   className="w-full h-24 p-3 bg-white border border-slate-200 rounded text-[13px] font-medium text-slate-900 outline-none focus:border-blue-500 transition-all resize-none shadow-sm" 
                                 />
                              </div>
                           </div>
                           <div className="w-80 space-y-4">
                              <div className="flex justify-between text-[13px]">
                                <span className="font-bold text-slate-500 uppercase tracking-widest">Sub Total</span>
                                <span className="font-bold text-slate-900 font-mono">₹{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between items-center text-[13px]">
                                <label className="text-slate-500 font-bold uppercase tracking-widest">Discount (%)</label>
                                <div className="flex items-center gap-4">
                                   <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="w-16 h-8 px-2 bg-white border border-slate-200 rounded text-right font-bold outline-none focus:border-blue-400 transition-all" />
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-[13px]">
                                <label className="text-slate-500 font-bold uppercase tracking-widest">Tax / GST (%)</label>
                                <select 
                                  value={selectedTax} 
                                  onChange={e => setSelectedTax(e.target.value)}
                                  className="w-32 h-8 px-2 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-700 outline-none focus:border-blue-400 transition-all"
                                >
                                   <option value="">No Tax</option>
                                   <option value="GST5">GST (5%)</option>
                                   <option value="GST12">GST (12%)</option>
                                   <option value="GST18">GST (18%)</option>
                                   <option value="GST28">GST (28%)</option>
                                </select>
                              </div>
                              <div className="flex justify-between items-center text-[13px]">
                                <span className="text-slate-500 font-bold uppercase tracking-widest">Adjustment</span>
                                <input type="number" value={adjustment} onChange={e => setAdjustment(e.target.value)} className="w-24 h-8 px-2 bg-white border border-slate-200 rounded text-right font-bold outline-none focus:border-blue-400 transition-all" />
                              </div>
                              <div className="pt-6 border-t border-slate-200 flex justify-between items-center bg-slate-50 -mx-8 px-8 py-4 mt-6 rounded-lg">
                                <span className="text-[14px] font-bold text-slate-500 uppercase tracking-widest">Total Amount</span>
                                <span className="text-[24px] font-bold text-[#1e61f0] tracking-tighter font-mono">₹{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                           </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Actions Footer */}
            <footer className="bg-white border-t border-slate-200 px-12 py-4 flex items-center justify-between shrink-0 sticky bottom-0 z-20 shadow-[0_-5px_25px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    Encrypted & Secure Proposal Storage
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/quotes')}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-[12px] font-bold hover:bg-slate-50 transition-all uppercase tracking-widest"
                    >
                        Discard
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-[12px] hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all uppercase tracking-widest flex items-center gap-2 active:scale-95"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {loading ? 'Processing...' : (editId ? 'Update Quote' : 'Confirm Quote')}
                    </button>
                </div>
            </footer>
            {isQuickAddOpen && (
                <div className="fixed inset-0 z-[500] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsQuickAddOpen(false)} />
                    <div className="relative w-[500px] bg-white h-full shadow-2xl flex flex-col">
                        <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight italic uppercase">Register New Customer</h3>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Unified Infrastructure Onboarding</p>
                            </div>
                            <button onClick={() => setIsQuickAddOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 shadow-sm border border-slate-100"><X size={24}/></button>
                        </header>
                        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-white no-scrollbar">
                           <div className="space-y-6">
                              <div className="grid grid-cols-4 gap-4">
                                 <div className="col-span-1 space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Salutation</label>
                                    <select value={quickAddForm.salutation} onChange={e => setQuickAddForm({...quickAddForm, salutation: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-blue-500">
                                       <option>Mr.</option><option>Ms.</option><option>Mrs.</option><option>Dr.</option>
                                    </select>
                                 </div>
                                 <div className="col-span-3 space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Primary Name*</label>
                                    <input type="text" value={quickAddForm.name} onChange={e => setQuickAddForm({...quickAddForm, name: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-blue-500" placeholder="Full Legal Name" />
                                 </div>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Client Email</label>
                                 <div className="relative">
                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input type="email" value={quickAddForm.email} onChange={e => setQuickAddForm({...quickAddForm, email: e.target.value})} className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-blue-500" placeholder="contact@business.com" />
                                 </div>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Mobile Contact</label>
                                 <div className="relative">
                                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input 
                                        type="text" 
                                        value={quickAddForm.mobile} 
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setQuickAddForm({...quickAddForm, mobile: val});
                                        }} 
                                        maxLength={10}
                                        className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-blue-500" 
                                        placeholder="10-digit mobile number" 
                                    />
                                 </div>
                              </div>
                           </div>
                           <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                              <Info size={18} className="text-blue-500 mt-0.5" />
                              <p className="text-[12px] text-blue-600 font-medium italic">You can always update detailed information like GSTIN and Billing Address later from the contact detail view.</p>
                           </div>
                        </div>
                        <footer className="p-8 border-t border-slate-100 flex items-center gap-4 bg-slate-50/50">
                           <button onClick={() => setIsQuickAddOpen(false)} className="flex-1 py-3 text-slate-500 font-bold text-[11px] uppercase tracking-widest hover:bg-white transition-all">Cancel</button>
                           <button 
                               onClick={handleQuickAdd}
                               disabled={isSavingCustomer || !quickAddForm.name}
                               className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-black shadow-xl shadow-slate-200 transition-all"
                           >
                               {isSavingCustomer ? <RefreshCw size={18} className="animate-spin mx-auto" /> : 'REGISTER CUSTOMER'}
                           </button>
                        </footer>
                    </div>
                </div>
            )}
            {showQuoteSettings && (
                <QuoteNoSettingsModal 
                    quoteNo={quoteNo}
                    onClose={() => setShowQuoteSettings(false)}
                    onSave={(newVal) => setQuoteNo(newVal)}
                />
            )}
            <ConfirmModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                showCancel={modalConfig.showCancel}
                confirmText={modalConfig.confirmText}
            />
        </div>
    );
};

const QuotesView = ({ companyId }) => {
    const addNotification = useNotificationStore(state => state.addNotification);
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const isNew = location.pathname.includes('/new');
    const isEdit = location.pathname.includes('/edit');
    const isView = location.pathname.includes('/view') || (!isNew && !isEdit && id);

    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(id);
    const [deleteId, setDeleteId] = useState(null);

    const fetchQuotes = () => {
        if (!companyId) return;
        setLoading(true);
        quoteAPI.getByCompany(companyId)
            .then(res => setQuotes(res.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!companyId) return;
        fetchQuotes();
    }, [companyId]);

    useEffect(() => {
        if (!isNew && !isEdit) {
            setSelectedId(id || null);
        }
    }, [id, isNew, isEdit]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await quoteAPI.delete(deleteId);
            if (selectedId === deleteId) navigate('/quotes');
            setDeleteId(null);
            fetchQuotes();
        } catch (err) {
            addNotification('Failed to delete quote', 'error');
            setDeleteId(null);
        }
    };

    if (isNew || isEdit) return <NewQuoteForm companyId={companyId} navigate={navigate} editId={id} />;

    return (
        <>
            <ConfirmModal 
                isOpen={!!deleteId}
                onConfirm={handleDelete}
                onClose={() => setDeleteId(null)}
                title="Confirm Proposal Deletion"
                message="Are you sure you want to permanently delete this proposal? This action cannot be reversed and all history will be lost."
            />
            <div className="flex h-[calc(100vh-80px)] bg-[#f8fafc] overflow-hidden">
                {/* LIST SIDEBAR - Hidden when a quote is selected for a clean document view */}
                {!selectedId && (
                    <div className="w-full border-r border-slate-200 bg-white flex flex-col shrink-0 transition-all duration-300 relative z-30 shadow-sm">
                        <QuotesList 
                            quotes={quotes} 
                            loading={loading} 
                            navigate={navigate} 
                            onDelete={setDeleteId} 
                            onRefresh={fetchQuotes}
                            selectedId={selectedId}
                            onSelect={(qid) => navigate(`/quotes/view/${qid}`)}
                        />
                    </div>
                )}

                {/* DETAIL PANE */}
                {selectedId ? (
                    <div className="flex-1 overflow-auto bg-[#f4f7fa] relative">
                        <button 
                            onClick={() => navigate('/quotes')}
                            className="absolute right-8 top-6 text-slate-400 hover:text-slate-600 transition-colors z-30 p-2 hover:bg-white rounded-full shadow-sm"
                        >
                            <X size={20} />
                        </button>
                        <QuoteDetailView quoteId={selectedId} navigate={navigate} companyId={companyId} />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-[#f4f7fa]">
                        <div className="bg-white p-6 rounded-full shadow-inner mb-4">
                            <FileText size={48} className="opacity-20" />
                        </div>
                        <p className="font-medium">Select a quote to view details</p>
                    </div>
                )}
            </div>
        </>
    );
};

// ─────────────────────────────────────────────────
// UTILS: NUMBER TO WORDS
// ─────────────────────────────────────────────────

export default QuotesView;
