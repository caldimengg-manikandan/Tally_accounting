import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ledgerAPI, retainerInvoiceAPI } from '../../services/api';
import { 
  Plus, MoreHorizontal, ChevronDown, Settings, 
  X, Info, Upload as UploadIcon, Search, Tag, Paperclip, RefreshCw,
  Edit2, Trash2, ChevronRight, ArrowDownUp, Download, RotateCcw,
  ArrowUp, ArrowDown, ArrowLeft, FileStack, User, Calendar, Landmark, FileBarChart2 as FileStackIcon, FileText, Download as DownloadIcon, Paperclip as PaperclipIcon
} from 'lucide-react';

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

const RetainerInvoicesView = ({ companyId }) => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const isNew = location.pathname.includes('/new');
    const isEdit = location.pathname.includes('/edit');
    const isView = location.pathname.includes('/view');

    const [view, setView] = useState('list'); // 'list', 'form', 'email', 'detail'
    const [activeRetainer, setActiveRetainer] = useState(null);
    const [retainers, setRetainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState(null);

    const fetchRetainers = () => {
        if (!companyId) return;
        setLoading(true);
        retainerInvoiceAPI.getByCompany(companyId)
            .then(res => setRetainers(res.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!companyId) return;
        if (!isNew && !isEdit && !isView) {
            setView('list');
            fetchRetainers();
        } else if (isView) {
            setView('detail');
        } else {
            setView('form');
        }
    }, [companyId, isNew, isEdit, isView]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await retainerInvoiceAPI.delete(deleteId);
            setDeleteId(null);
            fetchRetainers();
        } catch (err) {
            alert('Failed to delete retainer invoice');
            setDeleteId(null);
        }
    };

    if (view === 'email') return <EmailSendView retainer={activeRetainer} onCancel={() => navigate('/retainer-invoices')} onSend={() => navigate('/retainer-invoices')} />;
    if (view === 'detail') return <RetainerDetailView retainerId={id} companyId={companyId} navigate={navigate} onSaved={(ret) => { setActiveRetainer(ret); setView('email'); }} />;
    
    return (
        <>
            <DeleteConfirmModal 
                isOpen={!!deleteId}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                title="Confirm Deletion"
                message="Are you sure you want to permanently delete this retainer invoice? This action cannot be undone."
            />
            { (isNew || isEdit || view === 'form') ? (
                <NewRetainerForm companyId={companyId} navigate={navigate} editId={id} onSaved={(ret) => { navigate(`/retainer-invoices/view/${ret.id || id}`); }} />
            ) : (
                <RetainerList retainers={retainers} loading={loading} navigate={navigate} onDelete={setDeleteId} onRefresh={fetchRetainers} />
            )}
        </>
    );
};

// ─────────────────────────────────────────────────
// RETAINER LIST VIEW
// ─────────────────────────────────────────────────
const RetainerList = ({ retainers, loading, navigate, onDelete, onRefresh }) => {
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [activeSubMenu, setActiveSubMenu] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'invoiceDate', direction: 'desc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
        setIsOptionsOpen(false);
    };

    const sortedData = [...retainers].sort((a, b) => {
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
            <p className="text-slate-500 text-[14px]">Loading Retainer Invoices...</p>
        </div>
    );

    return (
        <div className="bg-white min-h-screen flex flex-col">
            <div className="flex items-center justify-between px-8 py-3 border-b border-slate-200 shadow-sm sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2 cursor-pointer px-2 py-1 bg-slate-50 border border-slate-200 rounded">
                    <h1 className="text-[17px] font-bold text-slate-800">All Retainer Invoices</h1>
                    <ChevronDown size={18} className="text-blue-500" />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/retainer-invoices/new')} className="bg-[#1e61f0] hover:bg-[#1a54d1] text-white px-4 py-1.5 rounded-[4px] text-[13px] font-semibold flex items-center gap-1.5 shadow-sm transition-all">
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
                            className="absolute right-0 top-full mt-2 w-[220px] bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 z-50 py-1 text-[13px] font-medium text-[#2c3e50] animate-fade-down origin-top-right"
                          >
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
                                      <SortOption label="Date" sortKey="invoiceDate" />
                                      <SortOption label="Invoice Number" sortKey="invoiceNumber" />
                                      <SortOption label="Customer Name" sortKey="customerName" />
                                      <SortOption label="Amount" sortKey="totalAmount" />
                                      <SortOption label="Status" sortKey="status" />
                                   </div>
                                )}
                             </div>

                             <div onClick={onRefresh} className="px-4 py-2.5 hover:bg-[#1e61f0] hover:text-white group cursor-pointer flex items-center gap-3 transition-colors border-t border-slate-100 mt-1 pt-3">
                                <RefreshCw size={16} className="text-[#1e61f0] group-hover:text-white"/>
                                <span>Refresh List</span>
                             </div>
                          </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {retainers.length > 0 ? (
                    <div className="p-8">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Retainer#</th>
                                    <th className="px-6 py-4">Customer Name</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedData.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => navigate(`/retainer-invoices/view/${r.id}`)}>
                                        <td className="px-6 py-4 text-[14px] text-slate-600">
                                            {new Date(r.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-[14px] font-medium text-slate-900">{r.invoiceNumber}</td>
                                        <td className="px-6 py-4 text-[14px] text-slate-700 font-semibold">{r.customerName}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-tight shrink-0
                                                ${r.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                                                  r.status === 'FullyApplied' ? 'bg-purple-100 text-purple-700' :
                                                  r.status === 'PartiallyApplied' ? 'bg-blue-100 text-blue-700' :
                                                  r.status === 'Sent' ? 'bg-amber-100 text-amber-700' : 
                                                  r.status === 'Draft' ? 'bg-slate-100 text-slate-500' : 'bg-slate-100 text-slate-700'}`}>
                                                {r.status || 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-[14px] font-bold text-slate-900">
                                            ₹ {parseFloat(r.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/retainer-invoices/view/${r.id}`); }}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded shadow-sm transition-all"
                                                >
                                                    <Search size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        const targetId = r.id || r._id || r.invoiceId;
                                                        if (targetId) navigate(`/retainer-invoices/edit/${targetId}`); 
                                                        else alert('Invalid ID');
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded shadow-sm transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
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
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 text-center animate-fade-up">
                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-8">
                            <FileStack size={48}/>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Retainer Invoices</h3>
                        <p className="text-slate-400 font-medium max-w-md mx-auto mb-8">Collect advance payments from your customers to secure future work or projects.</p>
                        <button onClick={() => navigate('/retainer-invoices/new')} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-lg flex items-center gap-2 hover:bg-slate-800 transition-colors uppercase text-[14px] tracking-wide">
                            <Plus size={18}/> Create Retainer Invoice
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────
// NEW RETAINER FORM
// ─────────────────────────────────────────────────
const NewRetainerForm = ({ companyId, navigate, editId, onSaved }) => {
    const [customerName, setCustomerName] = useState('');
    const [customers, setCustomers] = useState([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const customerDropdownRef = useRef(null);
    const [invoiceNo, setInvoiceNo] = useState('RET-00001');
    const [refNo, setRefNo] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [projectName, setProjectName] = useState('');
    const [items, setItems] = useState([{ id: 1, description: '', amount: 0.00 }]);
    const [customerNotes, setCustomerNotes] = useState('');
    const [terms, setTerms] = useState('');
    const [loading, setLoading] = useState(false);

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(customerSearch.toLowerCase()))
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setShowCustomerDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!companyId) return;
        ledgerAPI.getByCompany(companyId)
            .then(res => setCustomers(res.data || []))
            .catch(console.error);
    }, [companyId]);

    useEffect(() => {
        if (editId) {
            console.log('DEBUG: Attempting to fetch retainer data for ID:', editId, 'with companyId:', companyId);
            setLoading(true);
            retainerInvoiceAPI.getById(editId)
                .then(res => {
                    const r = res.data;
                    if (r) {
                        setCustomerName(r.customerName || '');
                        setInvoiceNo(r.invoiceNumber || '');
                        setRefNo(r.referenceNumber || '');
                        if (r.invoiceDate) {
                            const date = new Date(r.invoiceDate);
                            setInvoiceDate(date.toISOString().split('T')[0]);
                        }
                        setProjectName(r.projectName || '');
                        setCustomerNotes(r.customerNotes || '');
                        setTerms(r.termsConditions || '');
                        
                        try {
                            const parsedItems = JSON.parse(r.itemsJson || '[]');
                            setItems(parsedItems.length > 0 ? parsedItems : [{ id: 1, description: '', amount: 0 }]);
                        } catch(e) {
                            console.error('Error parsing itemsJson:', e);
                            setItems([{ id: 1, description: '', amount: 0 }]);
                        }
                    }
                })
                .catch(err => {
                    const errMsg = err.response?.data?.error || err.message;
                    console.error(`Error fetching retainer for edit (ID: ${editId}):`, err);
                    alert(`Failed to load invoice data for ID ${editId}: ${errMsg}`);
                })
                .finally(() => setLoading(false));
        }
    }, [editId]);

    const subTotal = items.reduce((acc, item) => acc + parseFloat(item.amount || 0), 0);

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleSave = async (statusArg = 'Draft') => {
        if (!customerName) { alert('Please select a customer.'); return; }
        setLoading(true);
        try {
            const payload = {
                CompanyId: companyId,
                invoiceNumber: invoiceNo,
                customerName,
                referenceNumber: refNo,
                invoiceDate,
                projectName,
                items,
                totalAmount: subTotal,
                status: statusArg,
                customerNotes,
                termsConditions: terms
            };

            let response;
            if (editId) {
                response = await retainerInvoiceAPI.update(editId, payload);
            } else {
                response = await retainerInvoiceAPI.create(payload);
            }
            
            if (onSaved) {
                onSaved(response.data, statusArg === 'Sent');
            } else {
                navigate('/retainer-invoices');
            }
        } catch(e) {
            alert('Save failed: ' + (e.response?.data?.error || e.message));
        } finally {
            setLoading(false);
        }
    };

    const removeItem = (idx) => {
        if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
    };

    if (loading && editId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                <RefreshCw size={24} className="animate-spin text-[#1e61f0] mb-4" />
                <p className="text-slate-500 text-[14px]">Loading Invoice Data...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full">
            {/* STICKY HEADER */}
            <header className="sticky top-0 bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-40 shadow-sm shrink-0">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/retainer-invoices')}
                        className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase tracking-widest">Sales Module</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retainer Invoices</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            {editId ? 'Edit Retainer' : 'Create New Retainer'}
                            <span className="bg-slate-100 text-slate-500 text-[12px] px-3 py-1 rounded-full font-bold">{invoiceNo}</span>
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => handleSave('Draft')}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[13px] font-black hover:bg-slate-50 transition-all shadow-sm"
                    >
                        SAVE AS DRAFT
                    </button>
                    <button 
                        onClick={() => handleSave('Sent')}
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-black hover:bg-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all flex items-center gap-2"
                    >
                        SAVE & SEND <ChevronRight size={16} />
                    </button>
                </div>
            </header>

            <div className="flex-1 py-10 px-12 max-w-[1200px] w-full mx-auto animate-fade-up">
                <div className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100 p-12 mb-8">
                    <div className="grid grid-cols-12 gap-y-5 gap-x-8 mb-10">
                        <div className="col-span-3 text-[13px] font-black text-slate-400 uppercase tracking-widest flex items-center">Customer Name*</div>
                        <div className="col-span-9 relative" ref={customerDropdownRef}>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User size={18} className="text-slate-300" />
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
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                        <ChevronDown size={14} className="text-slate-400" />
                                    </div>
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
                                                            <div className="text-[10px] text-slate-400 font-medium tracking-wide text-ellipsis overflow-hidden whitespace-nowrap">{c.email || 'No email attached'}</div>
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
                                                onClick={() => navigate('/customers')}
                                                className="w-full py-2.5 px-4 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-[12px] font-black text-slate-600 hover:text-blue-600 flex items-center justify-center gap-2 transition-all shadow-sm"
                                            >
                                                <Plus size={14} strokeWidth={3} /> ADD NEW CUSTOMER
                                            </button>
                                        </div>
                                    </div>
                                )}
                        </div>

                        <div className="col-span-3 text-[13px] font-medium text-red-500 flex items-center">Retainer Invoice Number*</div>
                        <div className="col-span-9 flex items-center gap-4">
                            <div className="relative group w-[300px]">
                                <input type="text" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="w-full border border-slate-300 rounded-[4px] px-3 py-1.5 text-[14px] bg-slate-50 outline-none focus:bg-white transition-colors" />
                                <Settings size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>

                        <div className="col-span-3 text-[13px] font-medium text-slate-700 flex items-center">Reference#</div>
                        <div className="col-span-9">
                            <input type="text" value={refNo} onChange={e => setRefNo(e.target.value)} className="w-[300px] border border-slate-300 rounded-[4px] px-3 py-1.5 text-[14px] outline-none focus:border-blue-500" />
                        </div>

                        <div className="col-span-3 text-[13px] font-medium text-red-500 flex items-center">Retainer Invoice Date*</div>
                        <div className="col-span-9">
                            <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-[200px] border border-slate-300 rounded-[4px] px-3 py-1.5 text-[14px] outline-none focus:border-blue-500" />
                        </div>

                        <div className="col-span-3 text-[13px] font-black text-slate-400 uppercase tracking-widest flex items-center">Project Name</div>
                        <div className="col-span-9">
                            <div className="w-[400px]">
                                <select 
                                    value={projectName} 
                                    onChange={e => setProjectName(e.target.value)} 
                                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 bg-white shadow-sm transition-all cursor-pointer"
                                >
                                    <option value="">Select a project</option>
                                </select>
                                <p className="text-[11px] text-slate-400 mt-2 font-medium italic">Associated projects will appear here after selecting a customer.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-8 border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-4 py-3 w-10"></th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3 text-right w-40">Amount</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((it, idx) => (
                                    <tr key={it.id} className="border-b border-slate-100 group">
                                        <td className="px-4 text-slate-300">⋮⋮</td>
                                        <td className="px-4 py-3">
                                            <input type="text" value={it.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Retainer Amount for project" className="w-full outline-none text-[14px]" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input type="number" value={it.amount} onChange={e => updateItem(idx, 'amount', e.target.value)} className="w-full text-right outline-none text-[14px] font-medium" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={14}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-3 bg-slate-50 border-t border-slate-200">
                             <button onClick={() => setItems([...items, { id: Date.now(), description: '', amount: 0 }])} className="flex items-center gap-1.5 text-blue-600 text-[13px] font-bold hover:bg-blue-50 px-3 py-1.5 rounded transition-colors">
                                <Plus size={16}/> Add New Row
                             </button>
                        </div>
                    </div>

                    <div className="flex justify-end mb-10">
                        <div className="w-[300px] bg-slate-50 p-6 rounded-lg border border-slate-200">
                            <div className="flex justify-between items-center text-[15px] font-bold text-slate-900">
                                <span>Total</span>
                                <span>₹ {subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 mb-10">
                        <div className="max-w-[450px]">
                            <label className="text-[13px] font-medium text-slate-700 mb-1 block">Customer Notes</label>
                            <textarea value={customerNotes} onChange={e => setCustomerNotes(e.target.value)} placeholder="Enter any notes to be displayed in your transaction" rows="3" className="w-full border border-slate-300 rounded-[4px] p-2 text-[13px] outline-none focus:border-blue-500" />
                        </div>
                        <div className="max-w-[450px]">
                            <label className="text-[13px] font-medium text-slate-700 mb-1 block">Terms & Conditions</label>
                            <textarea value={terms} onChange={e => setTerms(e.target.value)} placeholder="Enter the terms and conditions" rows="3" className="w-full border border-slate-300 rounded-[4px] p-2 text-[13px] outline-none focus:border-blue-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────
// EMAIL SEND VIEW
// ─────────────────────────────────────────────────
const EmailSendView = ({ retainer, onCancel, onSend }) => {
    const customerEmail = "thejathangavel05@gmail.com"; 
    const userEmail = "naveenswathi1811@gmail.com"; 
    const userName = "Swathi N";
    const companyName = "Indus CAI private Ltd";

    const [subject, setSubject] = useState(`Retainer Invoice from ${companyName} (${retainer.invoiceNumber})`);
    const [body, setBody] = useState(`Dear Customer,\n\nThanks for your business.\n\nThe retainer invoice ${retainer.invoiceNumber} is attached with this email.\n\nRegards,\n${userName}\n${companyName}`);
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        setIsSending(true);
        try {
            await retainerInvoiceAPI.sendEmail(retainer.id, {
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
        <div className="bg-[#f8fafc] min-h-screen py-8 px-10 animate-fade-in text-center mx-auto">
            <h2 className="text-2xl font-bold mb-6 italic">Email To {retainer.customerName}</h2>
            <div className="max-w-2xl bg-white p-8 rounded-lg shadow-sm border border-slate-200 mx-auto text-left">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                    <input type="text" value={customerEmail} readOnly className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 italic" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 italic" />
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea value={body} onChange={e => setBody(e.target.value)} rows="8" className="w-full border border-gray-300 rounded px-3 py-2 italic" />
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800 italic">Cancel</button>
                    <button onClick={handleSend} disabled={isSending} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 italic">
                        {isSending ? 'Sending...' : 'Send Email'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────
// RETAINER DETAIL VIEW
// ─────────────────────────────────────────────────
const RetainerDetailView = ({ retainerId, companyId, navigate, onSaved }) => {
    const [retainer, setRetainer] = useState(null);
    const [allRetainers, setAllRetainers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyId || !retainerId) return;
        setLoading(true);
        Promise.all([
            retainerInvoiceAPI.getById(retainerId),
            retainerInvoiceAPI.getByCompany(companyId)
        ]).then(([resDetail, resList]) => {
            setRetainer(resDetail.data);
            setAllRetainers(resList.data || []);
        }).finally(() => setLoading(false));
    }, [retainerId, companyId]);

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);

    const handleRecordPayment = async () => {
        try {
            await retainerInvoiceAPI.recordPayment(retainerId, paymentAmount);
            setIsPaymentModalOpen(false);
            // Refresh
            const res = await retainerInvoiceAPI.getById(retainerId);
            setRetainer(res.data);
        } catch (err) {
            alert('Payment failed: ' + (err.response?.data?.error || err.message));
        }
    };

    const handlePrint = () => { window.print(); };

    if (loading || !retainer) return <div className="p-20 text-center">Loading details...</div>;

    const items = JSON.parse(retainer.itemsJson || '[]');

    return (
        <div className="flex h-screen bg-[#f8fafc] print:bg-white overflow-hidden">
            <div className="w-[320px] bg-white border-r border-slate-200 flex flex-col shrink-0 print:hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-700">All Retainer Invoices</span>
                    <button onClick={() => navigate('/retainer-invoices/new')} className="p-1.5 bg-blue-600 text-white rounded"><Plus size={14}/></button>
                </div>
                <div className="flex-1 overflow-auto">
                    {allRetainers.map(r => (
                        <div key={r.id} onClick={() => navigate(`/retainer-invoices/view/${r.id}`)} className={`p-4 border-b border-slate-100 cursor-pointer ${r.id === retainerId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                            <div className="font-bold text-[13px]">{r.customerName}</div>
                            <div className="text-[11px] text-slate-500">{r.invoiceNumber} • ₹{parseFloat(r.totalAmount).toLocaleString()}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-auto">
                <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center print:hidden">
                    <h2 className="font-bold">{retainer.invoiceNumber}</h2>
                    <div className="flex gap-2">
                        <button onClick={() => navigate(`/retainer-invoices/edit/${retainer.id}`)} className="px-3 py-1.5 border rounded text-sm hover:bg-slate-50 flex items-center gap-1.5">
                            <Edit2 size={14}/> Edit
                        </button>
                        <button onClick={() => onSaved(retainer)} className="px-3 py-1.5 border rounded text-sm hover:bg-slate-50 flex items-center gap-1.5">
                            <PaperclipIcon size={14}/> Send
                        </button>
                        <button onClick={() => { setPaymentAmount(parseFloat(retainer.totalAmount) - parseFloat(retainer.amountReceived || 0)); setIsPaymentModalOpen(true); }} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1.5">
                            <Landmark size={14}/> Record Payment
                        </button>
                        <button onClick={handlePrint} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1.5">
                            <DownloadIcon size={14}/> Print
                        </button>
                    </div>
                </div>

                <div className="p-12 flex justify-center">
                    <div className="w-[800px] bg-white shadow-xl p-16 border relative">
                        {retainer.status === 'Sent' && <div className="absolute top-5 right-5 text-blue-600 font-bold border-2 border-blue-600 px-3 py-1 -rotate-12">SENT</div>}
                        <div className="flex justify-between mb-20">
                            <div>
                                <h1 className="text-xl font-bold">Indus CAI private Ltd</h1>
                                <p className="text-slate-500">Tamil Nadu, India</p>
                            </div>
                            <div className="text-right">
                                <h1 className="text-4xl font-light text-slate-400">RETAINER INVOICE</h1>
                                <p className="font-bold">{retainer.invoiceNumber}</p>
                            </div>
                        </div>

                        <div className="mb-10 text-right">
                            <p className="text-slate-500">Date: <span className="text-black font-medium">{new Date(retainer.invoiceDate).toLocaleDateString()}</span></p>
                        </div>

                        <table className="w-full mb-10 border-t">
                            <thead>
                                <tr className="bg-slate-800 text-white text-sm">
                                    <th className="px-4 py-2 text-left">Description</th>
                                    <th className="px-4 py-2 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {items.map((it, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-4">{it.description}</td>
                                        <td className="px-4 py-4 text-right">₹{parseFloat(it.amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-end mb-20 text-right">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-slate-500"><span>Sub Total</span><span>₹{parseFloat(retainer.totalAmount).toLocaleString()}</span></div>
                                <div className="flex justify-between text-slate-500"><span>Sub Total</span><span>₹{parseFloat(retainer.totalAmount).toLocaleString()}</span></div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>₹{parseFloat(retainer.totalAmount).toLocaleString()}</span></div>
                                <div className="flex justify-between text-green-600 font-bold"><span>Amount Received</span><span>₹{parseFloat(retainer.amountReceived || 0).toLocaleString()}</span></div>
                                <div className="flex justify-between text-blue-600 font-bold"><span>Used in Invoices</span><span>₹{parseFloat(retainer.amountUsed || 0).toLocaleString()}</span></div>
                                <div className="flex justify-between text-slate-900 font-black border-t-2 border-slate-900 pt-2 bg-slate-50 px-2 rounded">
                                    <span>Available Balance</span>
                                    <span>₹{(parseFloat(retainer.amountReceived || 0) - parseFloat(retainer.amountUsed || 0)).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-32 pt-4 border-t w-64">
                            <p className="font-bold italic">Authorized Signature</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-black text-slate-900">RECORD PAYMENT</h3>
                            <button onClick={() => setIsPaymentModalOpen(false)}><X size={18}/></button>
                        </div>
                        <div className="p-6">
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">AMOUNT RECEIVED (₹)</label>
                            <input 
                                type="number" 
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value)}
                                className="w-full text-2xl font-black text-slate-900 border-b-2 border-slate-200 outline-none focus:border-blue-500 py-2"
                                autoFocus
                            />
                            <p className="text-[11px] text-slate-400 mt-2 italic">Outstanding: ₹{(parseFloat(retainer.totalAmount) - parseFloat(retainer.amountReceived || 0)).toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-slate-50 flex gap-2">
                            <button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-3 text-[12px] font-black text-slate-500">CANCEL</button>
                            <button 
                                onClick={handleRecordPayment}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[12px] font-black shadow-lg shadow-blue-600/20"
                            >
                                SAVE PAYMENT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RetainerInvoicesView;
