import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ledgerAPI, quoteAPI, companyAPI, priceListAPI } from '../../services/api';
import { 
  Plus, MoreHorizontal, ChevronDown, Settings, 
  X, Info, Upload as UploadIcon, Search, Tag, Paperclip, RefreshCw,
  Edit2, Trash2, ChevronRight, ArrowDownUp, Download, RotateCcw,
  ArrowUp, ArrowDown, ArrowLeft, FileText, Building, Package, Check,
  Mail, Phone, Send, HelpCircle
} from 'lucide-react';
import { inventoryAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';
import ConfirmModal from '../../components/ConfirmModal';

// ─────────────────────────────────────────────────
// ITEM SEARCH SELECTOR (FOR TABLE CELLS)
// ─────────────────────────────────────────────────
const ItemSearchSelector = ({ value, onChange, items, placeholder }) => {
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

    const filtered = items.filter(it => 
        it.name.toLowerCase().includes(search.toLowerCase()) ||
        (it.salesDescription && it.salesDescription.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="relative w-full" ref={containerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between cursor-pointer group"
            >
                <div className="flex-1">
                    {value ? (
                        <div className="text-[14px] font-black text-slate-900 tracking-tight">{value}</div>
                    ) : (
                        <div className="text-[14px] font-medium text-slate-300 italic">{placeholder}</div>
                    )}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[400px] bg-white border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-xl z-[100] overflow-hidden animate-fade-in">
                    <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search items or descriptions..."
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-blue-500 transition-all font-medium"
                            />
                        </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto no-scrollbar py-1">
                        {filtered.length > 0 ? (
                            filtered.map(it => (
                                <div 
                                    key={it.id}
                                    onClick={() => {
                                        onChange(it);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors group mx-1 rounded-lg"
                                >
                                    <div className="flex justify-between items-start mb-0.5">
                                        <div className="text-[14px] font-black text-slate-800 tracking-tight flex items-center gap-2">
                                            <Package size={14} className="text-blue-500 opacity-50" />
                                            {it.name}
                                        </div>
                                        <div className="text-[13px] font-black text-slate-900">₹{parseFloat(it.sellingPrice || 0).toLocaleString()}</div>
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis italic">
                                        {it.salesDescription || 'No description provided'}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center text-slate-400 text-[13px] font-medium">No items found.</div>
                        )}
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
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Bulk Item Selection</h3>
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
                                            <span className={`text-[15px] font-black tracking-tight ${isPicked ? 'text-blue-700' : 'text-slate-800'}`}>{it.name}</span>
                                            <span className={`text-[15px] font-black ${isPicked ? 'text-blue-900' : 'text-slate-900'}`}>₹{parseFloat(it.sellingPrice || 0).toLocaleString()}</span>
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
                            <h4 className="text-slate-900 font-black text-lg mb-1">No matches found</h4>
                            <p className="text-slate-400 font-medium text-[13px]">Try a different keyword or filter.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 flex items-center justify-between px-8 py-6 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-white rounded-full border border-slate-200 text-[12px] font-black text-slate-600 shadow-sm uppercase tracking-widest">
                            {selectedIds.length} Items Selected
                        </div>
                        {selectedIds.length > 0 && (
                            <button onClick={() => setSelectedIds([])} className="text-[11px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors">Clear All</button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[13px] font-black hover:bg-slate-100 transition-all uppercase tracking-widest">Discard</button>
                        <button 
                            disabled={selectedIds.length === 0}
                            onClick={handleConfirm}
                            className="px-10 py-3 bg-blue-600 text-white rounded-xl text-[13px] font-black hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all uppercase tracking-widest disabled:opacity-50 disabled:shadow-none"
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
                    <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">{title}</h3>
                    <p className="text-slate-500 text-[14px] leading-relaxed font-medium">
                        {message}
                    </p>
                </div>
                <div className="p-4 bg-slate-50 flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={onCancel}
                        className="flex-1 py-3 px-6 bg-white border border-slate-200 text-slate-600 rounded-xl text-[13px] font-black hover:bg-slate-100 transition-all uppercase tracking-widest"
                    >
                        CANCEL
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="flex-1 py-3 px-6 bg-red-600 text-white rounded-xl text-[13px] font-black hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all uppercase tracking-widest"
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
                    <h3 className="text-[18px] font-black text-slate-900 italic tracking-tighter uppercase">Quote Configuration</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20}/></button>
                </div>
                <div className="space-y-5">
                    <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Numbering Prefix</label>
                        <input value={prefix} onChange={e => setPrefix(e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-[14px] font-bold outline-none focus:border-[#1e61f0] transition-colors" />
                    </div>
                    <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Starting Sequence</label>
                        <input value={nextNum} onChange={e => setNextNum(e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-[14px] font-bold outline-none focus:border-[#1e61f0] transition-colors" />
                    </div>
                    <div className="bg-slate-50 rounded p-4 border border-slate-100">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Live Sequence Preview</p>
                        <span className="font-black text-[#1e61f0] text-[18px] italic tracking-tighter">{prefix}{nextNum}</span>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={onClose} className="px-6 py-2 border border-slate-200 rounded text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">Discard</button>
                    <button onClick={() => { onSave(`${prefix}${nextNum}`); onClose(); }} className="px-6 py-2 bg-[#1e61f0] text-white rounded text-[13px] font-black hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all uppercase tracking-widest">Apply Format</button>
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
            <div className={`p-4 flex items-center justify-between border-b border-slate-100 ${isSplit ? 'px-4' : 'px-8'}`}>
                <div className="flex items-center gap-3">
                    <h1 className={`${isSplit ? 'text-[18px]' : 'text-[24px]'} font-bold text-slate-900`}>Quotes</h1>
                    <div className="relative group">
                        <button onClick={() => setIsOptionsOpen(!isOptionsOpen)} className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400 group-hover:text-slate-600 transition-colors">
                            <ChevronDown size={isSplit ? 16 : 20} />
                        </button>
                        {isOptionsOpen && (
                            <div className="absolute left-0 mt-2 w-[220px] bg-white border border-slate-200 rounded-md shadow-2xl z-50 py-1 animate-fade-down">
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
                <button 
                  onClick={() => navigate('/quotes/new')} 
                  className={`bg-[#4885ed] text-white rounded-[4px] font-bold hover:bg-[#3478e8] shadow-sm transition-all flex items-center gap-1.5
                    ${isSplit ? 'px-3 py-1.5 text-[12px]' : 'px-5 py-2 text-[14px]'}`}
                >
                    <Plus size={isSplit ? 16 : 18} /> {isSplit ? 'New' : 'New Quote'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar relative">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-60 opacity-50">
                        <RefreshCw className="animate-spin text-[#1e61f0] mb-2" size={24} />
                        <span className="text-[12px] font-medium tracking-widest uppercase font-black">Syncing...</span>
                    </div>
                ) : (
                    <>
                        <div className="bg-slate-50 border-b border-slate-100 flex items-center px-6 py-3 sticky top-0 z-10">
                            <div className="w-24 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</div>
                            <div className="flex-1 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Customer Details</div>
                            <div className="w-24 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</div>
                            <div className="w-24 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</div>
                            <div className="w-20 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</div>
                        </div>

                        {sortedQuotes.length === 0 ? (
                            <div className="p-20 text-center opacity-40">
                                 <Tag size={48} className="mx-auto mb-4" />
                                 <p className="text-sm font-medium">No quotes found.</p>
                                 <button onClick={() => navigate('/quotes/new')} className="mt-4 text-[#1e61f0] font-bold text-[13px] hover:underline">Create One Now</button>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {sortedQuotes.map(q => (
                                    <div 
                                        key={q.id} 
                                        onClick={() => onSelect(q.id)}
                                        className={`px-6 py-4 cursor-pointer transition-all border-l-[4px] flex items-center group
                                            ${String(q.id) === String(selectedId) ? 'bg-[#f0f5ff] border-l-[#1e61f0]' : 'hover:bg-slate-50 border-l-transparent'}`}
                                    >
                                        <div className="w-24 text-[12px] font-bold text-slate-400">
                                             {new Date(q.quoteDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </div>

                                        <div className="flex-1 pl-4">
                                            <div className={`text-[13px] font-black ${String(q.id) === String(selectedId) ? 'text-[#1e61f0]' : 'text-slate-800'} transition-colors`}>
                                                {q.customerName}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">#{q.quoteNumber}</div>
                                        </div>

                                        <div className="w-24 text-right pr-2">
                                             <div className="text-[14px] font-black text-slate-900 tracking-tight">₹{parseFloat(q.totalAmount || 0).toLocaleString()}</div>
                                        </div>

                                        <div className="w-24 flex justify-center">
                                            <span className={`px-2 py-0.5 rounded uppercase text-[8px] font-black tracking-widest border ${q.status === 'Accepted' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                {q.status || 'Draft'}
                                            </span>
                                        </div>

                                        <div className="w-20 flex justify-center gap-1">
                                             <button 
                                                onClick={(e) => { e.stopPropagation(); navigate(`/quotes/edit/${q.id}`); }} 
                                                className="p-1.5 hover:bg-white rounded text-slate-400 hover:text-blue-600 transition-all border border-transparent hover:border-slate-100"
                                                title="Edit"
                                            >
                                                <Edit2 size={13} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDelete(q.id); }} 
                                                className="p-1.5 hover:bg-white rounded text-slate-400 hover:text-red-500 transition-all border border-transparent hover:border-slate-100"
                                                title="Delete"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
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
        return <EmailSendView quote={quote} onCancel={() => setView('detail')} onSend={() => navigate('/quotes')} />;
    }

    const items = typeof quote.itemsJson === 'string' ? JSON.parse(quote.itemsJson) : (quote.itemsJson || []);

    return (
        <div className="animate-fade-in p-8 pb-32">
            <style>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #printable-quote, #printable-quote * {
                        visibility: visible !important;
                    }
                    #printable-quote {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                    }
                    .print-hidden {
                        display: none !important;
                    }
                }
            `}</style>
            {/* Header / Actions Sidebar Style */}
            <header className="sticky top-0 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between z-20 shadow-sm print:hidden shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-[18px] font-black text-slate-800 italic uppercase tracking-tighter">{quote.quoteNumber}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${quote.status === 'Accepted' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {quote.status || 'Draft'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/quotes/edit/${quote.id}`)} className="p-2.5 hover:bg-slate-50 rounded border border-slate-200 text-slate-500 transition-colors" title="Edit"><Edit2 size={16}/></button>
                    <button onClick={() => window.print()} className="p-2.5 hover:bg-slate-50 rounded border border-slate-200 text-slate-500 transition-colors" title="Download PDF / Print"><Download size={16}/></button>
                    <div className="w-px h-6 bg-slate-200 mx-2"></div>
                    <button onClick={() => setView('email')} className="bg-[#1e61f0] text-white px-6 py-2.5 rounded text-[13px] font-black hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all uppercase tracking-widest">Send Quote</button>
                    <button 
                        onClick={() => navigate('/sales/new-invoice', { state: { quoteData: quote } })}
                        className="bg-emerald-600 text-white px-6 py-2.5 rounded text-[13px] font-black hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all uppercase tracking-widest flex items-center gap-2"
                    >
                        <Check size={16} strokeWidth={3} /> Convert to Invoice
                    </button>
                    <button className="p-2.5 hover:bg-slate-50 rounded border border-slate-200 text-slate-500"><MoreHorizontal size={16}/></button>
                </div>
            </header>

            {/* Document Layout - Professional Business Format */}
            <div id="printable-quote" className="mt-20 bg-white shadow-2xl max-w-[850px] mx-auto border border-slate-200 rounded-sm relative print:shadow-none print:mt-0 print:border-0 min-h-[1100px] flex flex-col">
                
                {/* Visual Accent Top */}
                <div className="h-2 bg-slate-900 w-full" />

                <div className="p-16 flex-1">
                    <div className="flex justify-between items-start mb-20">
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">QUOTE</h1>
                                <p className="text-slate-400 text-[12px] font-black uppercase tracking-[0.4em]">DOCUMENT ID / {quote.quoteNumber}</p>
                            </div>
                            
                            <div className="pt-10">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">ISSUED TO</p>
                                <div className="space-y-1">
                                    <h4 className="font-black text-[22px] text-slate-900 leading-tight">{quote.customerName}</h4>
                                    <p className="text-slate-500 font-bold text-[13px] uppercase tracking-wide">Customer Account</p>
                                </div>
                            </div>
                        </div>

                        <div className="text-right flex flex-col items-end">
                            <div className="w-24 h-24 bg-slate-900 rounded-2xl flex items-center justify-center text-white mb-6 shadow-2xl shadow-slate-200 group transition-transform hover:scale-105 overflow-hidden border-4 border-white">
                                <span className="text-4xl font-black italic tracking-tighter">C</span>
                            </div>
                            <div className="space-y-1 text-right">
                                <h3 className="font-black text-slate-900 uppercase text-[15px] tracking-widest">{currentCompany?.name || 'COMMERCIAL HUB LTD'}</h3>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{currentCompany?.state}, {currentCompany?.country}</p>
                                <p className="text-[11px] text-blue-600 font-black lowercase tracking-wider">{currentCompany?.email}</p>
                            </div>

                            <div className="mt-16 grid grid-cols-2 gap-x-10 gap-y-4 text-right border-t border-slate-100 pt-8 w-full max-w-[280px]">
                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest pt-1">Date</div>
                                <div className="font-black text-slate-900 text-[14px]">{new Date(quote.quoteDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                
                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest pt-1">Reference</div>
                                <div className="font-black text-slate-700 text-[14px] uppercase truncate max-w-[120px]">{quote.referenceNumber || 'N/A'}</div>
                                
                                {quote.expiryDate && (
                                    <>
                                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest pt-1">Expires</div>
                                        <div className="font-black text-rose-500 text-[14px]">{new Date(quote.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Modern Professional Table */}
                    <div className="mt-12 rounded-lg overflow-hidden border border-slate-100 shadow-sm mb-12">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em]">
                                <tr>
                                    <th className="px-8 py-5">#</th>
                                    <th className="px-8 py-5">Description of Services</th>
                                    <th className="px-8 py-5 text-center">Qty</th>
                                    <th className="px-8 py-5 text-right">Unit Rate</th>
                                    <th className="px-8 py-5 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {items.map((it, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-6 text-slate-300 font-black text-[14px]">{String(idx + 1).padStart(2, '0')}</td>
                                        <td className="px-8 py-6">
                                            <p className="font-black text-[15px] text-slate-900 tracking-tight leading-tight">{it.itemDetails}</p>
                                            <p className="text-[12px] text-slate-400 font-medium mt-1 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Standard Service Category</p>
                                        </td>
                                        <td className="px-8 py-6 text-center text-slate-600 font-bold text-[14px]">{parseFloat(it.quantity).toLocaleString()} units</td>
                                        <td className="px-8 py-6 text-right text-slate-600 font-bold text-[14px]">₹{parseFloat(it.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-8 py-6 text-right font-black text-[16px] text-slate-900">₹{parseFloat(it.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Financial Summary Block */}
                    <div className="flex justify-end pt-12 pb-20">
                        <div className="w-full max-w-[420px] space-y-4">
                            <div className="bg-white border-2 border-slate-900 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="p-8 space-y-4">
                                    <div className="flex justify-between items-center text-[13px] font-bold text-slate-500 uppercase tracking-widest">
                                        <span>Sub Total</span>
                                        <span className="text-slate-900 font-black">₹{parseFloat(quote.subTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>

                                    {parseFloat(quote.discount || 0) > 0 && (
                                        <div className="flex justify-between items-center text-[13px] font-bold text-emerald-600 uppercase tracking-widest">
                                            <span>Applied Discount ({quote.discount}%)</span>
                                            <span className="font-black">- ₹{(parseFloat(quote.subTotal || 0) * (parseFloat(quote.discount) / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}

                                    {/* GST Breakdown */}
                                    {String(quote.selectedTax).toLowerCase().includes('gst') ? (
                                        <div className="pt-2 mt-2 border-t border-slate-50 space-y-3">
                                            <div className="flex justify-between items-center text-[13px] font-black text-slate-400 uppercase tracking-widest">
                                                <span>CGST ({parseFloat(quote.selectedTax.replace(/\D/g, '') || 0) / 2}%)</span>
                                                <span className="text-slate-700">₹{(parseFloat(quote.taxAmount || 0) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[13px] font-black text-slate-400 uppercase tracking-widest">
                                                <span>SGST ({parseFloat(quote.selectedTax.replace(/\D/g, '') || 0) / 2}%)</span>
                                                <span className="text-slate-700">₹{(parseFloat(quote.taxAmount || 0) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[11px] font-bold text-slate-300 border-t border-slate-50 pt-2 uppercase tracking-[0.2em]">
                                                <span>Total Tax</span>
                                                <span>₹{parseFloat(quote.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    ) : quote.taxAmount > 0 ? (
                                        <div className="flex justify-between items-center text-[13px] font-bold text-slate-500 uppercase tracking-widest">
                                            <span>Tax ({quote.selectedTax})</span>
                                            <span className="text-slate-900 font-black">₹{parseFloat(quote.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center text-[12px] font-bold text-slate-300 uppercase tracking-widest italic py-1">
                                            <span>Tax (Non-Taxable)</span>
                                            <span>₹0.00</span>
                                        </div>
                                    )}

                                    {/* Adjustments */}
                                    {parseFloat(quote.adjustment || 0) !== 0 && (
                                        <div className="flex justify-between items-center text-[13px] font-bold text-slate-500 uppercase tracking-widest">
                                            <span>Adjustments</span>
                                            <span className={parseFloat(quote.adjustment) > 0 ? "text-slate-900 font-black" : "text-rose-600 font-black"}>
                                                {parseFloat(quote.adjustment) > 0 ? '+' : ''} ₹{parseFloat(quote.adjustment).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="px-8 py-8 bg-slate-900 flex justify-between items-baseline text-white">
                                    <div className="space-y-0">
                                        <span className="text-[14px] font-black uppercase tracking-[0.2em] italic opacity-60">Grand Total</span>
                                        <p className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.3em] mt-1 italic">Incl. All Taxes</p>
                                    </div>
                                    <span className="text-4xl font-black tracking-tighter italic">₹{parseFloat(quote.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                            
                            {/* Amount in Words */}
                            <div className="px-4 text-right">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 items-end flex justify-end gap-2">
                                    <Info size={10}/> Total Amount in Words
                                </p>
                                <p className="text-[12px] font-bold text-slate-500 italic max-w-[300px] ml-auto leading-tight">
                                    {numberToWords(Math.round(quote.totalAmount || 0))} Rupees Only
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secure Footer Block */}
                <div className="bg-slate-900 p-12 grid grid-cols-2 gap-16 text-white min-h-[220px]">
                    {quote.termsConditions && (
                        <div className="space-y-4">
                            <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em]">TERMS & CONDITIONS</p>
                            <p className="text-[12px] text-white/70 leading-relaxed font-medium line-clamp-4">{quote.termsConditions}</p>
                        </div>
                    )}
                    {quote.customerNotes && (
                        <div className="space-y-4 text-right ml-auto max-w-[300px]">
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">OFFICIAL REMARKS</p>
                            <p className="text-[12px] text-white/80 leading-relaxed font-bold italic tracking-tight">"{quote.customerNotes}"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────
// EMAIL SEND VIEW
// ─────────────────────────────────────────────────
const EmailSendView = ({ quote, onCancel, onSend }) => {
    const addNotification = useNotificationStore(state => state.addNotification);
    const [customerEmail, setCustomerEmail] = useState(quote.customerEmail || "thejathangavel5@gmail.com"); 
    const userEmail = "thejathangal5@gmail.com"; 
    const userName = "Administrator";
    const companyName = "Indus CAI private Ltd";

    const [subject, setSubject] = useState(`Quote from ${companyName} (${quote.quoteNumber})`);
    const [body, setBody] = useState(`Dear Customer,\n\nThanks for your business.\n\nThe quote ${quote.quoteNumber} is attached with this email.\n\nRegards,\n${userName}\n${companyName}`);
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        setIsSending(true);
        try {
            await quoteAPI.sendEmail(quote.id, {
                subject,
                body,
                toEmail: customerEmail
            });
            addNotification('Email sent successfully!', 'success');
            onSend();
        } catch (err) {
            console.error(err);
            addNotification('Failed to send email: ' + (err.response?.data?.error || err.message), 'error');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-[#f8fafc] min-h-screen pt-28 pb-20 px-10 animate-fade-up">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black italic text-slate-900 uppercase tracking-tighter">Compose Message</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Proposal to {quote.customerName}</p>
                    </div>
                    <button onClick={onCancel} className="p-3 hover:bg-white rounded-full text-slate-400 hover:text-slate-900 transition-all">
                        <X size={24}/>
                    </button>
                </div>

                <div className="bg-white p-10 rounded-xl shadow-2xl shadow-slate-200 border border-slate-100">
                    <div className="space-y-6">
                        <div className="grid grid-cols-12 items-center gap-4">
                            <label className="col-span-2 text-[11px] font-black text-slate-300 uppercase tracking-widest">Recipient</label>
                            <div className="col-span-10 relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input type="text" value={customerEmail} readOnly className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-[14px] font-bold text-slate-500 outline-none italic" />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 items-center gap-4 border-t border-slate-50 pt-6">
                            <label className="col-span-2 text-[11px] font-black text-slate-300 uppercase tracking-widest">Subject</label>
                            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="col-span-10 px-4 py-3 bg-white border border-slate-100 rounded-lg text-[14px] font-bold text-slate-900 outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-50 transition-all italic" />
                        </div>

                        <div className="border-t border-slate-50 pt-6">
                            <label className="block text-[11px] font-black text-slate-300 uppercase tracking-widest mb-4">Message Body</label>
                            <textarea 
                                value={body} 
                                onChange={e => setBody(e.target.value)} 
                                rows="10" 
                                className="w-full px-6 py-6 bg-slate-50/30 border border-slate-100 rounded-xl text-[14px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all italic leading-relaxed" 
                            />
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-lg flex items-center justify-between border border-blue-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded">
                                    <FileText size={18}/>
                                </div>
                                <div>
                                    <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{quote.quoteNumber}.pdf</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Auto-generated attachment</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Ready to attach</span>
                        </div>

                        <div className="flex justify-end items-center gap-4 pt-8">
                            <button onClick={onCancel} className="px-6 py-2.5 text-slate-400 font-bold text-[13px] hover:text-slate-900 uppercase tracking-widest transition-all">Discard</button>
                            <button 
                                onClick={handleSend} 
                                disabled={isSending} 
                                className="bg-[#1e61f0] text-white px-10 py-3 rounded-lg font-black text-[14px] hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSending ? <RefreshCw className="animate-spin" size={18}/> : <Send size={18}/>}
                                {isSending ? 'Transmitting...' : 'Send Proposal'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────
// NEW QUOTE FORM
// ─────────────────────────────────────────────────
const NewQuoteForm = ({ companyId, navigate, editId }) => {
    const addNotification = useNotificationStore(state => state.addNotification);
    // Form State
    const [customerName, setCustomerName] = useState('');
    const [customers, setCustomers] = useState([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickAddForm, setQuickAddForm] = useState({ name: '', email: '', mobile: '', salutation: 'Mr.' });
    const [isSavingCustomer, setIsSavingCustomer] = useState(false);
    const customerDropdownRef = useRef(null);
    const [quoteNo, setQuoteNo] = useState('QT-000001');
    const [showQuoteSettings, setShowQuoteSettings] = useState(false);
    const [refNo, setRefNo] = useState('');
    const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
    const [expiryDate, setExpiryDate] = useState('');
    const [salesperson, setSalesperson] = useState('');
    const [project, setProject] = useState('');
    const [priceList, setPriceList] = useState('');
    const [subject, setSubject] = useState('');
    const [selectedTax, setSelectedTax] = useState('');
    const [attachedFiles, setAttachedFiles] = useState([]);
    const fileInputRef = useRef(null);
    
    const [items, setItems] = useState([{ id: Date.now(), itemDetails: '', quantity: 1.00, rate: 0.00, amount: 0.00 }]);
    const [discount, setDiscount] = useState(0);
    const [adjustment, setAdjustment] = useState(0);
    const [customerNotes, setCustomerNotes] = useState('Looking forward for your business.');
    const [terms, setTerms] = useState('');
    const [loading, setLoading] = useState(false);
    const location = useLocation();

    const [inventoryItems, setInventoryItems] = useState([]);
    const [priceLists, setPriceLists] = useState([]);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isPriceListDropdownOpen, setIsPriceListDropdownOpen] = useState(false);
    const [priceListSearch, setPriceListSearch] = useState('');
    const priceListRef = useRef(null);

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
            // Remove the empty row if it's the only one
            const filtered = prev.filter(item => item.itemDetails.trim() !== '' || item.rate > 0);
            return [...filtered, ...mapped];
        });
    };

    const addItem = () => {
        setItems([...items, { id: Date.now(), itemDetails: '', quantity: 1, rate: 0, amount: 0 }]);
    };

    const removeItem = (index) => {
        if (items.length <= 1) {
            setItems([{ id: Date.now(), itemDetails: '', quantity: 1, rate: 0, amount: 0 }]);
            return;
        }
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        if (field === 'quantity' || field === 'rate') {
            newItems[index].amount = (parseFloat(newItems[index].quantity) || 0) * (parseFloat(newItems[index].rate) || 0);
        }
        setItems(newItems);
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

    // Calculations
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

    // Fetch real customers & items
    useEffect(() => {
        const activeCoId = companyId || localStorage.getItem('companyId');
        if (!activeCoId) return;
        
        Promise.all([
            ledgerAPI.getByCompany(activeCoId),
            inventoryAPI.getByCompany(activeCoId),
            priceListAPI.getByCompany(activeCoId)
        ])
        .then(([ledgersRes, invRes, priceRes]) => {
            const allLedgers = ledgersRes.data || [];
            setCustomers(allLedgers.filter(l => {
                const g = l.Group?.name || '';
                return g.toLowerCase().includes('debtor') || g.toLowerCase().includes('customer');
            }));
            setInventoryItems(invRes.data || []);
            setPriceLists(priceRes.data || []);
        })
        .catch(err => console.error("DATA HYDRATION FAILED:", err));
    }, [companyId]);

    // Auto-select customer if passed via state
    useEffect(() => {
        if (location.state?.customerId && customers.length > 0) {
            const found = customers.find(c => String(c.id) === String(location.state.customerId));
            if (found) {
                setCustomerName(found.name);
                setCustomerSearch(found.name);
            }
        }
    }, [location.state?.customerId, customers]);

    // Fetch existing quote if editing
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
                }
            });
        }
    }, [editId]);

    // Apply Price List to Items
    useEffect(() => {
        if (!priceList || items.length === 0) return;
        const selectedList = priceLists.find(p => p.id === priceList);
        if (!selectedList) return;

        const percentage = parseFloat(selectedList.percentage) || 0;
        const isMarkup = selectedList.markupType === 'Markup';

        const updatedItems = items.map(item => {
            // Find base rate from inventory if itemDetails matches
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

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setShowCustomerDropdown(false);
            }
            if (priceListRef.current && !priceListRef.current.contains(event.target)) {
                setIsPriceListDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(customerSearch.toLowerCase())
    );

    const handleSave = async () => {
        // Validation logic
        const missingFields = [];
        if (!customerName) missingFields.push('Customer Name');
        if (!quoteNo) missingFields.push('Quote Number');
        if (!quoteDate) missingFields.push('Quote Date');
        
        // Ensure at least one item has content
        const validItems = items.filter(it => it.itemDetails.trim() !== '' && it.rate > 0);
        if (validItems.length === 0) {
            addNotification('Please add at least one item with a valid rate.', 'error');
            return;
        }

        if (missingFields.length > 0) {
            addNotification(`Required fields missing: ${missingFields.join(', ')}`, 'error');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                companyId,
                quoteNumber: quoteNo,
                customerName,
                customerEmail: customers.find(c => c.name === customerName)?.email || '',
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
                termsConditions: terms
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
        <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
            <BulkItemSelectorModal 
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onAdd={handleBulkAdd}
                items={inventoryItems}
            />

            {/* Header */}
            <header className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-white z-50">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-100 rounded text-slate-600">
                        <FileText size={18} />
                    </div>
                    <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">{editId ? 'Edit Quote' : 'New Quote'}</h2>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/quotes')} className="text-[13px] font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest">Discard</button>
                    <button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="px-8 py-2 bg-[#1e61f0] text-white text-[13px] font-black rounded shadow-lg shadow-blue-100 hover:bg-[#1a56d9] transition-all uppercase tracking-widest"
                    >
                        {loading ? 'Saving...' : 'Confirm Quote'}
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 max-w-[1200px] w-full mx-auto">
                <div className="bg-white rounded-lg border border-slate-200 p-10 space-y-10 shadow-sm animate-fade-in">
                    
                    {/* Top Section: Labels on Left, Inputs on Right */}
                    <div className="space-y-6 max-w-3xl">
                        
                        {/* Customer Name */}
                        <div className="flex items-center gap-8">
                            <label className="w-40 text-[13px] font-bold text-red-500">Customer Name*</label>
                            <div className="flex-1 relative group" ref={customerDropdownRef}>
                                <div className="flex shadow-sm">
                                    <input 
                                        type="text"
                                        value={customerSearch}
                                        onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                                        onFocus={() => setShowCustomerDropdown(true)}
                                        placeholder="Select or add a customer"
                                        className="flex-1 h-9 px-3 bg-white border border-slate-300 rounded-l text-[14px] outline-none focus:border-blue-500 transition-all font-medium"
                                    />
                                    <button className="px-3 bg-[#1e61f0] text-white rounded-r flex items-center justify-center">
                                        <Search size={14} />
                                    </button>
                                </div>
                                
                                {showCustomerDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded z-50 overflow-hidden">
                                        <div className="max-h-60 overflow-y-auto">
                                            {filteredCustomers.length === 0 ? (
                                                <div className="p-4 text-center">
                                                    <p className="text-[12px] text-slate-400 mb-2">No customers found</p>
                                                    <button onClick={() => setIsQuickAddOpen(true)} className="text-[11px] text-blue-600 font-bold uppercase tracking-widest hover:underline">+ Add New</button>
                                                </div>
                                            ) : (
                                                <div className="py-1">
                                                    {filteredCustomers.map(c => (
                                                        <div 
                                                            key={c.id}
                                                            onClick={() => { setCustomerName(c.name); setCustomerSearch(c.name); setShowCustomerDropdown(false); }}
                                                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-[14px] text-slate-700 font-medium"
                                                        >
                                                            {c.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quote# */}
                        <div className="flex items-center gap-8">
                            <label className="w-40 text-[13px] font-bold text-slate-600">Quote#*</label>
                            <div className="flex-1 relative max-w-sm">
                                <input 
                                    value={quoteNo}
                                    readOnly
                                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded text-[14px] font-medium outline-none shadow-sm"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-blue-500" onClick={() => setShowQuoteSettings(true)}>
                                    <Settings size={14} />
                                </div>
                            </div>
                        </div>

                        {/* Reference# */}
                        <div className="flex items-center gap-8">
                            <label className="w-40 text-[13px] font-bold text-slate-600">Reference#</label>
                            <input 
                                value={refNo}
                                onChange={(e) => setRefNo(e.target.value)}
                                className="flex-1 h-9 px-3 border border-slate-300 rounded text-[14px] outline-none focus:border-blue-500 font-medium shadow-sm max-w-md"
                            />
                        </div>

                        {/* Quote Date & Expiry Date */}
                        <div className="flex items-center gap-8">
                            <label className="w-40 text-[13px] font-bold text-red-500">Quote Date*</label>
                            <div className="flex-1 flex items-center gap-8 max-w-2xl">
                                <input 
                                    type="date"
                                    value={quoteDate}
                                    onChange={(e) => setQuoteDate(e.target.value)}
                                    className="flex-1 h-9 px-3 border border-slate-300 rounded text-[14px] font-medium shadow-sm"
                                />
                                <label className="text-[13px] font-bold text-slate-600 w-24">Expiry Date</label>
                                <input 
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    className="flex-1 h-9 px-3 border border-slate-300 rounded text-[14px] font-medium shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Salesperson */}
                        <div className="flex items-center gap-8">
                            <label className="w-40 text-[13px] font-bold text-slate-600">Salesperson</label>
                            <select 
                                value={salesperson}
                                onChange={(e) => {
                                    if (e.target.value === 'ADD_NEW') {
                                        navigate('/customers/new');
                                    } else {
                                        setSalesperson(e.target.value);
                                    }
                                }}
                                className="flex-1 h-9 px-3 border border-slate-300 rounded text-[14px] bg-white font-medium italic text-slate-400 shadow-sm max-w-md"
                            >
                                <option value="">Select or Add Salesperson</option>
                                <option value="ADD_NEW">+ Add New Salesperson</option>
                                <option value="Internal Team">Internal Team</option>
                                <option value="Direct Sales">Direct Sales</option>
                            </select>
                        </div>

                        {/* Project Name */}
                        <div className="flex items-center gap-8">
                            <label className="w-40 text-[13px] font-bold text-slate-600">Project Name</label>
                            <div className="flex-1 max-w-md">
                                <select 
                                    value={project}
                                    onChange={(e) => setProject(e.target.value)}
                                    className="w-full h-9 px-3 border border-slate-300 rounded text-[14px] bg-white font-medium italic text-slate-400 shadow-sm"
                                >
                                    <option value="">Select a project</option>
                                </select>
                                <p className="text-[11px] text-slate-400 mt-1">Select a customer to associate a project.</p>
                            </div>
                        </div>

                        {/* Subject */}
                        <div className="flex items-start gap-8 pt-4">
                            <label className="w-40 text-[13px] font-bold text-slate-600 flex items-center gap-2 mt-2">Subject <Info size={14} className="text-slate-400" /></label>
                            <div className="flex-1 relative max-w-2xl">
                                <textarea 
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Let your customer know what this Quote is for"
                                    className="w-full p-3 border border-slate-300 rounded text-[14px] font-medium outline-none focus:border-blue-500 resize-none h-16 shadow-sm"
                                />
                                <div className="absolute right-3 bottom-2 text-slate-400">
                                    <div className="p-1.5 hover:bg-slate-50 rounded cursor-pointer"><Edit2 size={12} /></div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Price List Selection */}
                    <div className="relative" ref={priceListRef}>
                        <div 
                            onClick={() => setIsPriceListDropdownOpen(!isPriceListDropdownOpen)}
                            className="flex items-center gap-3 text-[13px] font-bold text-slate-500 pt-6 border-t border-slate-100 italic cursor-pointer hover:text-blue-600 transition-all select-none"
                        >
                            <FileText size={14} />
                            <span>{priceList ? priceLists.find(p => p.id === priceList)?.name || 'Select Price List' : 'Select Price List'}</span>
                            <ChevronDown size={14} className={`transition-transform duration-300 ${isPriceListDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {isPriceListDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-100 shadow-2xl rounded-2xl z-[100] overflow-hidden animate-scale-up">
                                <div className="p-3 border-b border-slate-50">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text"
                                            value={priceListSearch}
                                            onChange={e => setPriceListSearch(e.target.value)}
                                            placeholder="Search price lists..."
                                            className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl text-[12px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {priceLists.filter(p => !priceListSearch || p.name.toLowerCase().includes(priceListSearch.toLowerCase())).length > 0 ? (
                                        priceLists.filter(p => !priceListSearch || p.name.toLowerCase().includes(priceListSearch.toLowerCase())).map(p => (
                                            <div 
                                                key={p.id}
                                                onClick={() => {
                                                    setPriceList(p.id);
                                                    setIsPriceListDropdownOpen(false);
                                                }}
                                                className={`px-4 py-3 cursor-pointer transition-all border-b border-slate-50/50 last:border-0 hover:bg-blue-50 ${priceList === p.id ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
                                            >
                                                <p className="text-[13px] font-black">{p.name}</p>
                                                <p className={`text-[10px] uppercase font-bold tracking-widest mt-0.5 ${priceList === p.id ? 'text-blue-100' : 'text-slate-400'}`}>
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

                    {/* Item Table Header */}
                    <div className="bg-[#f8f9fa] border border-slate-200 rounded-t px-6 py-2.5 flex items-center justify-between">
                        <h3 className="text-[13px] font-black uppercase text-slate-700 tracking-tight">Item Table</h3>
                        <button className="text-[11px] font-bold text-blue-600 flex items-center gap-1.5 hover:bg-blue-50 px-3 py-1 rounded transition-all">
                            <Settings size={14} /> Bulk Actions
                        </button>
                    </div>

                    {/* Table Section */}
                    <div className="border-x border-b border-slate-200 rounded-b overflow-hidden shadow-sm">
                        <table className="w-full border-collapse bg-white">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">
                                    <th className="px-6 py-3 text-left">Item Details</th>
                                    <th className="px-6 py-3 text-right w-28">Quantity</th>
                                    <th className="px-6 py-3 text-right w-36">
                                        <div className="flex items-center justify-end gap-1.5">Rate <Settings size={12} className="text-slate-300"/></div>
                                    </th>
                                    <th className="px-6 py-3 text-right w-40">Amount</th>
                                    <th className="w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item, index) => (
                                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <input 
                                                value={item.itemDetails}
                                                onChange={(e) => updateItem(index, 'itemDetails', e.target.value)}
                                                placeholder="Type or click to select an item."
                                                className="w-full bg-transparent border-none outline-none text-[14px] font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:px-2 rounded transition-all"
                                            />
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <input 
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                className="w-full text-right bg-transparent border-none outline-none text-[14px] font-medium text-slate-600 focus:bg-white rounded transition-all"
                                            />
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <input 
                                                type="number"
                                                value={item.rate}
                                                onChange={(e) => updateItem(index, 'rate', e.target.value)}
                                                className="w-full text-right bg-transparent border-none outline-none text-[14px] font-medium text-slate-600 font-mono focus:bg-white rounded transition-all"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right align-top">
                                            <span className="text-[14px] font-bold text-slate-900 font-mono">{parseFloat(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center align-top">
                                            <button onClick={() => removeItem(index)} className="mt-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Actions */}
                    <div className="flex items-center gap-3 pt-4">
                        <button onClick={addItem} className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 text-blue-600 text-[12px] font-bold rounded shadow-sm hover:bg-slate-50 transition-all">
                            <Plus size={14} strokeWidth={3}/> Add New Row
                        </button>
                        <button onClick={() => setIsBulkModalOpen(true)} className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 text-blue-600 text-[12px] font-bold rounded shadow-sm hover:bg-slate-50 transition-all">
                            <Package size={14}/> Add Items in Bulk
                        </button>
                        <div className="ml-auto flex items-center gap-4 text-slate-400 font-bold text-[11px] uppercase tracking-widest pl-8 border-l border-slate-100">
                            <input type="file" ref={bulkFileRef} onChange={handleBulkImport} className="hidden" accept=".xlsx,.xls"/>
                            <button onClick={() => bulkFileRef.current.click()} className="hover:text-blue-600 transition-colors">Import Excel</button>
                        </div>
                    </div>

                    {/* Bottom Section: Notes and Totals */}
                    <div className="flex justify-between items-start pt-12 border-t border-slate-100 gap-20">
                        
                        {/* Customer Notes */}
                        <div className="flex-1 max-w-md">
                            <label className="text-[12px] font-bold text-slate-500 mb-3 block tracking-tight">Customer Notes</label>
                            <div className="relative">
                                <textarea 
                                    value={customerNotes}
                                    onChange={(e) => setCustomerNotes(e.target.value)}
                                    placeholder="Looking forward for your business."
                                    className="w-full h-24 p-4 border border-slate-200 rounded text-[13px] font-medium text-slate-600 outline-none focus:border-blue-500 transition-all resize-none shadow-sm"
                                />
                                <div className="absolute right-3 bottom-3 text-slate-300">
                                    <Edit2 size={12} />
                                </div>
                            </div>
                        </div>

                        {/* Totals Section */}
                        <div className="w-[450px] bg-slate-50/30 rounded-2xl p-8 space-y-6 border border-slate-100">
                            
                            <div className="flex justify-between text-[14px]">
                                <span className="font-bold text-slate-600">Sub Total</span>
                                <span className="font-bold text-slate-900 font-mono">{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div className="flex justify-between items-center text-[13px]">
                                <label className="text-slate-500 font-bold">Discount</label>
                                <div className="flex items-center gap-4">
                                    <div className="flex border border-slate-200 rounded overflow-hidden bg-white">
                                        <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="w-12 h-8 text-center bg-transparent outline-none border-r border-slate-200 font-bold" />
                                        <span className="px-2 py-1 text-slate-400 font-bold">%</span>
                                    </div>
                                    <span className="font-bold text-slate-900 font-mono">{discountAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-[13px]">
                                <label className="text-slate-500 font-bold">Tax / GST</label>
                                <div className="flex items-center gap-4">
                                     <select value={selectedTax} onChange={e => setSelectedTax(e.target.value)} className="w-[180px] h-8 px-3 border border-slate-200 rounded bg-white text-[12px] font-bold text-slate-700 outline-none shadow-sm">
                                        <option value="">Select a Tax</option>
                                        {TAX_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                     </select>
                                     <span className="font-bold text-slate-900 font-mono">+ {taxAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-[13px]">
                                <div className="flex items-center gap-2">
                                    <div className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-400 italic font-bold flex items-center justify-between shadow-sm cursor-help">
                                        Adjustment <HelpCircle size={14} className="text-slate-300"/>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input type="number" value={adjustment} onChange={(e) => setAdjustment(e.target.value)} className="w-24 h-8 px-3 border border-slate-200 rounded text-right font-bold outline-none shadow-sm" />
                                    <span className="font-bold text-slate-900 font-mono">{parseFloat(adjustment || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                                <span className="text-[15px] font-black text-slate-900 uppercase tracking-tight italic">Total ( ₹ )</span>
                                <span className="text-[22px] font-black text-slate-900 tracking-tighter italic font-mono">{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Add Customer Drawer */}
            {isQuickAddOpen && (
                <div className="fixed inset-0 z-[500] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsQuickAddOpen(false)} />
                    <div className="relative w-[500px] bg-white h-full shadow-2xl flex flex-col">
                        <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight italic uppercase">Register New Customer</h3>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Unified Infrastructure Onboarding</p>
                            </div>
                            <button onClick={() => setIsQuickAddOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 shadow-sm border border-slate-100"><X size={24}/></button>
                        </header>
                        
                        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-white no-scrollbar">
                           <div className="space-y-6">
                              <div className="grid grid-cols-4 gap-4">
                                 <div className="col-span-1 space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Salutation</label>
                                    <select value={quickAddForm.salutation} onChange={e => setQuickAddForm({...quickAddForm, salutation: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-blue-500">
                                       <option>Mr.</option><option>Ms.</option><option>Mrs.</option><option>Dr.</option>
                                    </select>
                                 </div>
                                 <div className="col-span-3 space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Primary Name*</label>
                                    <input type="text" value={quickAddForm.name} onChange={e => setQuickAddForm({...quickAddForm, name: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-blue-500" placeholder="Full Legal Name" />
                                 </div>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Client Email</label>
                                 <div className="relative">
                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input type="email" value={quickAddForm.email} onChange={e => setQuickAddForm({...quickAddForm, email: e.target.value})} className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-blue-500" placeholder="contact@business.com" />
                                 </div>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Mobile Contact</label>
                                 <div className="relative">
                                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input type="text" value={quickAddForm.mobile} onChange={e => setQuickAddForm({...quickAddForm, mobile: e.target.value})} className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-blue-500" placeholder="+91 XXXXX XXXXX" />
                                 </div>
                              </div>
                           </div>

                           <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                              <Info size={18} className="text-blue-500 mt-0.5" />
                              <p className="text-[12px] text-blue-600 font-medium italic">You can always update detailed information like GSTIN and Billing Address later from the contact detail view.</p>
                           </div>
                        </div>

                        <footer className="p-8 border-t border-slate-100 flex items-center gap-4 bg-slate-50/50">
                           <button onClick={() => setIsQuickAddOpen(false)} className="flex-1 py-3 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-white transition-all">Cancel</button>
                           <button 
                               onClick={handleQuickAdd}
                               disabled={isSavingCustomer || !quickAddForm.name}
                               className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-black shadow-xl shadow-slate-200 transition-all"
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
        </div>
    );
};

// ─────────────────────────────────────────────────
// MAIN ROUTER
// ─────────────────────────────────────────────────
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

export default QuotesView;
