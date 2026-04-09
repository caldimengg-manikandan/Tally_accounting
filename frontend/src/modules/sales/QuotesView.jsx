import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ledgerAPI, quoteAPI, companyAPI } from '../../services/api';
import { 
  Plus, MoreHorizontal, ChevronDown, Settings, 
  X, Info, Upload as UploadIcon, Search, Tag, Paperclip, RefreshCw,
  Edit2, Trash2, ChevronRight, ArrowDownUp, Download, RotateCcw,
  ArrowUp, ArrowDown, ArrowLeft, FileText, Building, Package, Check
} from 'lucide-react';
import { inventoryAPI } from '../../services/api';

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
        <div className="flex flex-col h-full bg-white">
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

            <div className="flex-1 overflow-y-auto no-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-60 opacity-50">
                        <RefreshCw className="animate-spin text-[#1e61f0] mb-2" size={24} />
                        <span className="text-[12px] font-medium">Syncing...</span>
                    </div>
                ) : sortedQuotes.length === 0 ? (
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
                                className={`px-5 py-4 cursor-pointer transition-all border-l-[4px]
                                  ${String(q.id) === String(selectedId) ? 'bg-[#f0f5ff] border-l-[#1e61f0]' : 'hover:bg-slate-50 border-l-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <span className={`text-[13px] font-bold ${String(q.id) === String(selectedId) ? 'text-[#1e61f0]' : 'text-slate-700'}`}>{q.customerName}</span>
                                    <span className="text-[14px] font-black text-slate-900 tracking-tight">₹{parseFloat(q.totalAmount || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider">#{q.quoteNumber} • {new Date(q.quoteDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                    <span className={`px-2 py-0.5 rounded uppercase text-[9px] font-black ${q.status === 'Accepted' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{q.status || 'Draft'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
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
            <style>
                {`
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
                        min-height: auto !important;
                        overflow: visible !important;
                        height: auto !important;
                    }
                    header, button, nav, aside {
                        display: none !important;
                    }
                }
                `}
            </style>
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
                    <button className="p-2.5 hover:bg-slate-50 rounded border border-slate-200 text-slate-500"><MoreHorizontal size={16}/></button>
                </div>
            </header>

            {/* Document Layout - Professional Business Format */}
            <div id="printable-quote" className="mt-20 bg-white shadow-2xl max-w-[850px] mx-auto border border-slate-200 rounded-sm relative print:shadow-none print:mt-0 print:border-0 min-h-[1120px] overflow-hidden flex flex-col">
                
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
                            <tbody className="divide-y divide-slate-100">
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
                    <div className="flex justify-end pt-12">
                        <div className="w-full max-w-[400px] bg-white border border-slate-100 rounded-xl p-8 shadow-2xl shadow-slate-100 space-y-4">
                            <div className="flex justify-between items-center text-[13px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>Sub Total</span>
                                <span className="text-slate-900">₹{parseFloat(quote.subTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>

                            {parseFloat(quote.discount || 0) > 0 && (
                                <div className="flex justify-between items-center text-[13px] font-bold text-emerald-500 uppercase tracking-widest">
                                    <span>Applied Discount ({quote.discount}%)</span>
                                    <span>- ₹{(parseFloat(quote.subTotal || 0) * (parseFloat(quote.discount) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}

                            {quote.selectedTax && (
                                <div className="flex justify-between items-center text-[13px] font-bold text-blue-600 uppercase tracking-widest">
                                    <span>GST / Tax ({quote.selectedTax})</span>
                                    <span>+ ₹{parseFloat(quote.taxAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}

                            {parseFloat(quote.adjustment || 0) !== 0 && (
                                <div className="flex justify-between items-center text-[13px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>Adjustments</span>
                                    <span className="text-slate-900">₹{parseFloat(quote.adjustment).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}

                            <div className="pt-6 mt-4 border-t-4 border-slate-900 flex justify-between items-baseline">
                                <div className="space-y-0">
                                    <span className="text-[13px] font-black text-slate-900 uppercase tracking-[0.2em] italic">Net Payable</span>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">ALL PRICES IN INDIAN RUPEE</p>
                                </div>
                                <span className="text-4xl font-black text-slate-900 tracking-tighter italic">₹{parseFloat(quote.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
            alert('Email sent successfully!');
            onSend();
        } catch (err) {
            console.error(err);
            alert('Failed to send email: ' + (err.response?.data?.error || err.message));
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

    const [inventoryItems, setInventoryItems] = useState([]);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

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
        if (!activeCoId) {
            console.warn("NO COMPANY ID FOUND FOR QUOTE FORM");
            return;
        }
        
        console.log("HYDRATING QUOTE FORM FOR CO:", activeCoId);
        
        Promise.all([
            ledgerAPI.getByCompany(activeCoId),
            inventoryAPI.getByCompany(activeCoId)
        ])
            .then(([ledgersRes, invRes]) => {
                setCustomers(ledgersRes.data || []);
                setInventoryItems(invRes.data || []);
            })
            .catch(err => {
                console.error("DATA HYDRATION FAILED:", err);
            });
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

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setShowCustomerDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(customerSearch.toLowerCase())
    );

    const handleSave = async () => {
        if (!customerName) { alert('Please select a customer.'); return; }
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
            alert('Failed to save quote');
        } finally {
            setLoading(false);
        }
    };

    const updateItem = (idx, field, val) => {
        const newItems = [...items];
        newItems[idx][field] = val;
        if (field === 'quantity' || field === 'rate') {
            newItems[idx].amount = parseFloat(newItems[idx].quantity || 0) * parseFloat(newItems[idx].rate || 0);
        }
        setItems(newItems);
    };

    const addItem = () => setItems([...items, { id: Date.now(), itemDetails: '', quantity: 1, rate: 0, amount: 0 }]);
    const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

    const handleQuickAdd = async () => {
        if (!quickAddForm.name) return;
        setIsSavingCustomer(true);
        try {
            const payload = {
                ...quickAddForm,
                companyId,
                groupName: 'Sundry Debtors',
                openingBalance: 0,
                currentBalance: 0
            };
            const res = await ledgerAPI.create(payload);
            const newCustomer = res.data.ledger || res.data;
            setCustomers([...customers, newCustomer]);
            setCustomerName(newCustomer.name);
            setCustomerSearch(newCustomer.name);
            setIsQuickAddOpen(false);
            setQuickAddForm({ name: '', email: '', mobile: '', salutation: 'Mr.' });
        } catch (err) {
            alert('Failed to register customer');
        } finally {
            setIsSavingCustomer(false);
        }
    };

    return (
        <div className="flex flex-col min-h-full">
            <BulkItemSelectorModal 
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onAdd={handleBulkAdd}
                items={inventoryItems}
            />
            {/* Header / Sidebar Alignment */}
            <header className="sticky top-0 bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-40 shadow-sm shrink-0">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/quotes')}
                        className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase tracking-widest">Business Proposals</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Quotes</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            {editId ? 'Reshape Quote' : 'Forge New Quote'}
                            <span className="bg-slate-100 text-slate-500 text-[12px] px-3 py-1 rounded-full font-bold">{quoteNo}</span>
                        </h2>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/quotes')} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[13px] font-black hover:bg-slate-50 transition-all shadow-sm">DISCARD</button>
                    <button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="px-10 py-3 bg-blue-600 text-white rounded-xl text-[13px] font-black hover:bg-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all uppercase tracking-widest disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'SAVE & PUBLISH'}
                    </button>
                </div>
            </header>

            <div className="pt-28 pb-20 px-12 max-w-[1200px] mx-auto animate-fade-up">
                <div className="bg-white rounded shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100 p-12 mb-8">
                    {/* Customer Selection */}
                    <div className="grid grid-cols-12 gap-10 mb-16">
                         <div className="col-span-8">
                            <label className="text-[11px] font-black text-[#1e61f0] uppercase tracking-[0.3em] mb-3 block">Customer Profile*</label>
                            <div className="relative group" ref={customerDropdownRef}>
                                <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none z-10">
                                    <Building size={18} className="text-slate-300 group-focus-within:text-[#1e61f0] transition-colors" />
                                </div>
                                <input 
                                    type="text"
                                    name={`user_search_${Math.random().toString(36).substring(7)}`}
                                    value={customerName || customerSearch}
                                    onChange={e => {
                                        setCustomerSearch(e.target.value);
                                        setCustomerName(''); 
                                        setShowCustomerDropdown(true);
                                    }}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                    placeholder="Select or add a customer"
                                    className="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-lg text-[15px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 shadow-sm transition-all placeholder:text-slate-300 placeholder:font-medium"
                                    autoComplete="off"
                                    data-lpignore="true"
                                    data-form-type="other"
                                />
                                <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-end px-4 gap-3 pointer-events-none">
                                    <ChevronDown size={14} className="text-slate-900" />
                                    <Search size={14} className="text-slate-300" />
                                </div>

                                {showCustomerDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-xl z-50 max-h-[400px] overflow-hidden flex flex-col animate-fade-in">
                                        {/* Search Header */}
                                        <div className="p-3 border-b border-slate-50 sticky top-0 bg-white">
                                            <div className="relative">
                                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="text"
                                                    autoFocus
                                                    placeholder="Search customers..."
                                                    value={customerSearch}
                                                    onChange={e => setCustomerSearch(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-[13px] outline-none focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-400 font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="overflow-y-auto flex-1 no-scrollbar py-1">
                                            {filteredCustomers.length > 0 ? (
                                                filteredCustomers.map(c => (
                                                    <div 
                                                        key={c.id} 
                                                        onClick={() => {
                                                            setCustomerName(c.name);
                                                            setCustomerSearch(c.name);
                                                            setShowCustomerDropdown(false);
                                                        }}
                                                        className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors group mx-1 rounded-lg"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[11px] group-hover:bg-blue-600 group-hover:text-white transition-all uppercase">
                                                            {c.name.substring(0, 2)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-[14px] font-bold text-slate-700 tracking-tight">{c.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{c.email || 'No email attached'}</div>
                                                        </div>
                                                        <ChevronRight size={14} className="text-slate-200 group-hover:text-blue-500 transition-colors" />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-5 py-10 text-center flex flex-col items-center gap-2">
                                                    <div className="p-3 bg-slate-50 rounded-full">
                                                        <Search size={24} className="text-slate-300" />
                                                    </div>
                                                    <div className="text-[13px] font-medium text-slate-500">No customers match "{customerSearch}"</div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Add New Footer */}
                                        <div className="p-2 bg-slate-50/50 border-t border-slate-100">
                                            <button 
                                                onClick={() => { setShowCustomerDropdown(false); setIsQuickAddOpen(true); }}
                                                className="w-full py-2.5 px-4 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-[12px] font-black text-slate-600 hover:text-blue-600 flex items-center justify-center gap-2 transition-all shadow-sm"
                                            >
                                                <Plus size={14} strokeWidth={3} /> REGISTER NEW CUSTOMER
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                         </div>
                         <div className="col-span-4">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Quote Sequence*</label>
                            <div 
                                onClick={() => setShowQuoteSettings(true)}
                                className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded cursor-pointer hover:border-[#1e61f0] transition-colors"
                            >
                                <span className="font-black text-slate-900 tracking-tight italic">{quoteNo}</span>
                                <Settings size={16} className="text-slate-400" />
                            </div>
                         </div>
                    </div>

                    <div className="grid grid-cols-4 gap-8 mb-16 border-t border-slate-50 pt-10">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Reference#</label>
                            <input value={refNo} onChange={e => setRefNo(e.target.value)} className="w-full border-b-2 border-slate-100 px-1 py-1 text-[14px] font-bold outline-none focus:border-[#1e61f0] transition-all" placeholder="PO-XXXX" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Quote Date*</label>
                            <input type="date" value={quoteDate} onChange={e => setQuoteDate(e.target.value)} className="w-full border-b-2 border-slate-100 px-1 py-1 text-[14px] font-bold outline-none focus:border-[#1e61f0] transition-all" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Validity Date</label>
                            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full border-b-2 border-slate-100 px-1 py-1 text-[14px] font-bold outline-none focus:border-[#1e61f0] transition-all" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Sales Officer</label>
                            <input value={salesperson} onChange={e => setSalesperson(e.target.value)} className="w-full border-b-2 border-slate-100 px-1 py-1 text-[14px] font-bold outline-none focus:border-[#1e61f0] transition-all" placeholder="Officer Name" />
                        </div>
                    </div>

                    <div className="mb-16">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Business Subject</label>
                        <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full border border-slate-200 rounded px-4 py-3 text-[14px] font-bold outline-none focus:border-[#1e61f0] bg-slate-50/20" placeholder="e.g. Annual Maintenance Contract Proposal for 2024" />
                    </div>

                    {/* ITEMS TABLE */}
                    <div className="mb-10 overflow-hidden border border-slate-100 rounded-2xl shadow-sm bg-white">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Details</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Qty</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Rate</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Amount</th>
                                    <th className="px-6 py-4 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {items.map((it, idx) => (
                                    <tr key={it.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <ItemSearchSelector 
                                                value={it.itemDetails}
                                                items={inventoryItems}
                                                placeholder="Type or click to select an Item."
                                                onChange={(selectedItem) => {
                                                    const newItems = [...items];
                                                    newItems[idx].itemDetails = selectedItem.name;
                                                    newItems[idx].rate = selectedItem.sellingPrice || 0;
                                                    newItems[idx].amount = (newItems[idx].quantity || 0) * (selectedItem.sellingPrice || 0);
                                                    setItems(newItems);
                                                }}
                                            />
                                            <textarea 
                                                value={it.itemDetails} 
                                                onChange={e => updateItem(idx, 'itemDetails', e.target.value)}
                                                placeholder="Add description..." 
                                                rows="1"
                                                className="w-full bg-transparent outline-none text-[12px] font-medium text-slate-400 mt-1 resize-none no-scrollbar placeholder:text-slate-300 italic" 
                                            />
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <input type="number" value={it.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className="w-full text-right bg-transparent outline-none text-[14px] font-bold text-slate-600 focus:text-blue-600 transition-colors" />
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <div className="flex items-center justify-end font-bold text-slate-600 text-[14px]">
                                                <span className="mr-1 text-slate-300 font-normal">₹</span>
                                                <input type="number" value={it.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} className="w-full text-right bg-transparent outline-none focus:text-blue-600 transition-colors" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 align-top font-black text-right text-[14px] text-slate-900">
                                            ₹ {parseFloat(it.amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-5 align-top text-center">
                                            <button onClick={() => removeItem(idx)} className="text-slate-200 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded"><X size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-4 bg-slate-50/30 flex items-center justify-between border-t border-slate-100">
                             <div className="flex items-center gap-2">
                                <button onClick={addItem} className="flex items-center gap-2 text-[#1e61f0] text-[13px] font-black hover:bg-blue-50 px-5 py-2.5 rounded-xl transition-all shadow-sm border border-transparent hover:border-blue-100">
                                    <Plus size={18} strokeWidth={3}/> ADD NEW ROW
                                </button>
                                <button 
                                    onClick={() => setIsBulkModalOpen(true)}
                                    className="flex items-center gap-2 text-slate-500 text-[13px] font-bold hover:bg-slate-100 px-5 py-2.5 rounded-xl transition-all"
                                >
                                    <Package size={16}/> ADD ITEMS IN BULK
                                </button>
                             </div>
                             
                             <div className="flex items-center gap-4">
                                 <input type="file" ref={bulkFileRef} onChange={handleBulkImport} className="hidden" accept=".xlsx,.xls"/>
                                 <button onClick={() => bulkFileRef.current.click()} className="flex items-center gap-2 text-slate-400 text-[11px] font-bold hover:text-slate-800 transition-colors uppercase tracking-widest">
                                    <UploadIcon size={14}/> BULK UPLOAD EXCEL
                                 </button>
                             </div>
                        </div>
                    </div>

                    {/* Summary & Totals */}
                    <div className="flex justify-between items-start pt-10 border-t border-slate-100 mt-10">
                        <div className="w-[450px] space-y-8">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Terms & Conditions</label>
                                <textarea value={terms} onChange={e => setTerms(e.target.value)} placeholder="Terms of business..." rows="4" className="w-full border border-slate-200 rounded p-4 text-[13px] font-medium text-slate-600 outline-none focus:border-[#1e61f0] bg-slate-50/30 italic" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Private Notes</label>
                                <textarea value={customerNotes} onChange={e => setCustomerNotes(e.target.value)} placeholder="Internal remarks..." rows="2" className="w-full border border-slate-200 rounded p-4 text-[13px] font-medium text-slate-600 outline-none focus:border-slate-400 bg-slate-50/30" />
                            </div>
                        </div>

                        <div className="w-[400px] bg-slate-900 rounded p-10 text-white shadow-2xl">
                             <div className="flex justify-between items-center mb-6 text-slate-400">
                                 <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Subtotal</span>
                                 <span className="font-black text-[16px]">₹ {subTotal.toLocaleString()}</span>
                             </div>
                             
                             <div className="flex justify-between items-center mb-6">
                                 <div className="flex items-center gap-3">
                                     <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-400">Offer Discount</span>
                                     <div className="flex border border-slate-700 rounded overflow-hidden w-20">
                                         <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="w-full bg-slate-800 px-2 py-1 text-[12px] font-black outline-none" />
                                         <span className="px-1 py-1 bg-slate-700 text-[10px] font-black">%</span>
                                     </div>
                                 </div>
                                 <span className="text-rose-400 font-black text-[15px]">- ₹ {discountAmt.toLocaleString()}</span>
                             </div>

                             <div className="flex justify-between items-center mb-10 pt-6 border-t border-slate-800">
                                 <div className="space-y-3 w-full">
                                     <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400 block mb-2">Government Levies</span>
                                     <select value={selectedTax} onChange={e => setSelectedTax(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-[12px] font-black outline-none focus:border-[#1e61f0]">
                                         <option value="">No Tax Applied</option>
                                         {TAX_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                     </select>
                                 </div>
                             </div>

                             <div className="flex justify-between items-center text-blue-400 font-black mb-10">
                                 <span className="text-[11px] uppercase tracking-widest">Calculated Tax</span>
                                 <span className="text-[18px]">+ ₹ {taxAmt.toLocaleString()}</span>
                             </div>

                             <div className="pt-8 border-t-2 border-slate-700 flex justify-between items-center">
                                 <span className="text-[16px] font-black italic tracking-tighter scale-y-110 origin-left uppercase">Final Quote</span>
                                 <span className="text-3xl font-black tracking-tighter text-[#ffce00] italic">₹ {total.toLocaleString()}</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {showQuoteSettings && <QuoteNoSettingsModal onClose={() => setShowQuoteSettings(false)} onSave={setQuoteNo} />}

            {/* Quick Add Customer Drawer */}
            {isQuickAddOpen && (
                <div className="fixed inset-0 z-[500] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsQuickAddOpen(false)} />
                    <div className="relative w-[500px] bg-white h-full shadow-2xl animate-slide-left flex flex-col">
                        <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Register New Customer</h3>
                                <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest mt-1">QUICK ONBOARDING</p>
                            </div>
                            <button onClick={() => setIsQuickAddOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm"><X size={24}/></button>
                        </header>
                        
                        <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
                           <div className="grid grid-cols-4 gap-4">
                              <div className="col-span-1 space-y-3">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Salutation</label>
                                 <select value={quickAddForm.salutation} onChange={e => setQuickAddForm({...quickAddForm, salutation: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all">
                                    <option>Mr.</option><option>Ms.</option><option>Mrs.</option><option>Dr.</option>
                                 </select>
                              </div>
                              <div className="col-span-3 space-y-3">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Primary Name*</label>
                                 <input type="text" value={quickAddForm.name} onChange={e => setQuickAddForm({...quickAddForm, name: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all" placeholder="Enter full name or business name" />
                              </div>
                           </div>

                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Customer Email</label>
                              <div className="relative">
                                 <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                 <input type="email" value={quickAddForm.email} onChange={e => setQuickAddForm({...quickAddForm, email: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all" placeholder="example@business.com" />
                              </div>
                           </div>

                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Mobile Number</label>
                              <div className="relative">
                                 <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                 <input type="text" value={quickAddForm.mobile} onChange={e => setQuickAddForm({...quickAddForm, mobile: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all" placeholder="+91 XXXXX XXXXX" />
                              </div>
                           </div>

                           <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-start gap-4">
                              <Info size={18} className="text-blue-500 mt-0.5" />
                              <p className="text-[12px] text-blue-600 font-medium leading-relaxed">You can always update additional information like GSTIN, Billing Address, and Payment Terms later from the Customer Detail view.</p>
                           </div>
                        </div>

                        <footer className="p-8 border-t border-slate-100 flex items-center gap-4 bg-slate-50/30">
                           <button onClick={() => setIsQuickAddOpen(false)} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[13px] font-black hover:bg-slate-100 transition-all uppercase tracking-widest">Cancel</button>
                           <button 
                              onClick={handleQuickAdd}
                              disabled={isSavingCustomer || !quickAddForm.name}
                              className="flex-1 py-4 bg-slate-900 text-white rounded-xl text-[13px] font-black hover:bg-black shadow-xl shadow-slate-200 transition-all uppercase tracking-widest disabled:opacity-50"
                           >
                              {isSavingCustomer ? <RefreshCw size={18} className="animate-spin mx-auto" /> : 'REGISTER CUSTOMER'}
                           </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────
// MAIN ROUTER
// ─────────────────────────────────────────────────
const QuotesView = ({ companyId }) => {
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
        if (id && !isNew && !isEdit) setSelectedId(id);
    }, [id, isNew, isEdit]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await quoteAPI.delete(deleteId);
            if (selectedId === deleteId) navigate('/quotes');
            setDeleteId(null);
            fetchQuotes();
        } catch (err) {
            alert('Failed to delete quote');
            setDeleteId(null);
        }
    };

    if (isNew || isEdit) return <NewQuoteForm companyId={companyId} navigate={navigate} editId={id} />;

    return (
        <>
            <DeleteConfirmModal 
                isOpen={!!deleteId}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
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

export default QuotesView;
