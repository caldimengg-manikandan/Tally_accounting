import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Search, Trash2, Edit2, LayoutGrid, 
  Activity, Briefcase, RefreshCcw, AlertCircle,
  Building2, Users2, Target, X, FileText, ChevronDown
} from 'lucide-react';
import { costCenterAPI, reportsAPI } from '../../services/api';

const CostCenterView = ({ showNew }) => {
    const [centers, setCenters] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reportLoading, setReportLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'report'
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(showNew || false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('General');
    const [parentCostCenterId, setParentCostCenterId] = useState('');
    const companyId = sessionStorage.getItem('companyId');

    const fetchCenters = useCallback(async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const res = await costCenterAPI.getByCompany(companyId);
            setCenters(Array.isArray(res.data) ? res.data : []);
        } catch (err) { console.error(err); }
        setLoading(false);
    }, [companyId]);

    const fetchReport = useCallback(async () => {
        if (!companyId) return;
        setReportLoading(true);
        try {
            const res = await reportsAPI.costCenterReport(companyId);
            setReportData(Array.isArray(res.data) ? res.data : []);
        } catch (err) { console.error(err); }
        setReportLoading(false);
    }, [companyId]);

    useEffect(() => { 
        fetchCenters(); 
        fetchReport();
    }, [fetchCenters, fetchReport]);

    const handleOpenCreate = () => {
        setEditMode(false);
        setEditId(null);
        setName('');
        setDescription('');
        setCategory('General');
        setParentCostCenterId('');
        setShowModal(true);
    };

    const handleOpenEdit = (center) => {
        setEditMode(true);
        setEditId(center.id);
        setName(center.name);
        setDescription(center.description || '');
        setCategory(center.category || 'General');
        setParentCostCenterId(center.parentCostCenterId || '');
        setShowModal(true);
    };

    const handleLoadDemoData = async () => {
        setLoading(true);
        try {
            const demoCenters = [
                { name: 'Marketing Department', category: 'Department', description: 'Global campaigns, events, and brand advertising budgets.', CompanyId: companyId },
                { name: 'Project Alpha', category: 'Project', description: 'Development and engineering costs for next-gen products.', CompanyId: companyId },
                { name: 'Mumbai Sales Branch', category: 'Branch', description: 'Sales office expenses and regional distribution costs.', CompanyId: companyId },
                { name: 'Research & Development', category: 'Department', description: 'Core research lab, innovation projects, and prototyping.', CompanyId: companyId }
            ];
            
            for (const payload of demoCenters) {
                await costCenterAPI.create(payload);
            }
            
            await fetchCenters();
            await fetchReport();
        } catch (err) {
            console.error(err);
            alert('Failed to load demo data.');
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { 
                name, 
                description, 
                category,
                parentCostCenterId: parentCostCenterId || null,
                CompanyId: companyId 
            };
            
            if (editMode) {
                await costCenterAPI.update(editId, payload);
            } else {
                await costCenterAPI.create(payload);
            }
            
            setName('');
            setDescription('');
            setCategory('General');
            setParentCostCenterId('');
            setShowModal(false);
            fetchCenters();
            fetchReport();
        } catch (err) { 
            alert(editMode ? 'Failed to update cost center' : 'Failed to create cost center'); 
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this cost center?')) return;
        try {
            await costCenterAPI.delete(id);
            fetchCenters();
            fetchReport();
        } catch (err) { alert('Delete failed'); }
    };

    const filtered = centers.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.category || '').toLowerCase().includes(search.toLowerCase())
    );

    const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in font-sans min-h-[calc(100vh-80px)] bg-slate-50/20">
            
            {/* Header */}
            <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                <div>
                   <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                         <Target size={20} className="animate-pulse" />
                      </div>
                      <span className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] font-sans">Resource Allocation</span>
                   </div>
                   <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Cost Centers</h1>
                   <p className="text-slate-400 text-xs font-bold mt-2">Tag and analyze line-level splits across business units and departments</p>
                </div>
                <div className="flex gap-3">
                   <button 
                     onClick={() => activeTab === 'report' ? fetchReport() : fetchCenters()} 
                     className="p-3.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-all shadow-sm flex items-center justify-center"
                     title="Refresh Data"
                   >
                     <RefreshCcw size={16} className={(loading || reportLoading) ? 'animate-spin' : ''} />
                   </button>
                   <button 
                      onClick={handleOpenCreate}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:shadow-blue-600/35 transition-all active:scale-[0.98] flex items-center gap-2"
                   >
                      <Plus size={16} strokeWidth={2.5}/> New Cost Center
                   </button>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 p-1.5 bg-slate-100/60 border border-slate-200/40 rounded-2xl w-fit shadow-inner">
                <button 
                    onClick={() => setActiveTab('directory')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${
                      activeTab === 'directory' 
                        ? 'bg-white text-blue-600 shadow-md border border-slate-200/40' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    Centers Directory
                </button>
                <button 
                    onClick={() => setActiveTab('report')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${
                      activeTab === 'report' 
                        ? 'bg-white text-blue-600 shadow-md border border-slate-200/40' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    Allocations Report
                </button>
            </div>

            {activeTab === 'directory' ? (
                <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-850 text-white shadow-xl shadow-blue-900/15 relative overflow-hidden flex flex-col justify-between h-44 group hover:scale-[1.01] transition-all duration-300">
                            <div className="absolute -right-6 -top-6 text-white/5 opacity-80 group-hover:scale-110 transition-transform duration-500"><Briefcase size={140} /></div>
                            <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1 relative z-10">Total Active Centers</p>
                            <h3 className="text-4xl font-black tracking-tight relative z-10">{centers.length}</h3>
                            <span className="text-[10px] font-bold text-blue-200 relative z-10 mt-auto bg-white/10 px-3 py-1 rounded-lg w-fit">Operational Business Units</span>
                        </div>
                        
                        <div className="p-8 rounded-3xl bg-white border border-slate-200/60 shadow-lg relative overflow-hidden flex flex-col justify-between h-44 group hover:scale-[1.01] transition-all duration-300">
                            <div className="absolute -right-6 -top-6 text-slate-100 opacity-60 group-hover:scale-110 transition-transform duration-500"><Target size={140} /></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Distinct Categories</p>
                            <h3 className="text-4xl font-black text-slate-800 tracking-tight relative z-10">{new Set(centers.map(c => c.category)).size}</h3>
                            <span className="text-[10px] font-bold text-slate-500 relative z-10 mt-auto bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg w-fit">Classification Groups</span>
                        </div>
                        
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-950/10 relative overflow-hidden flex flex-col justify-between h-44 group hover:scale-[1.01] transition-all duration-300">
                            <div className="absolute -right-6 -top-6 text-white/5 opacity-80 group-hover:scale-110 transition-transform duration-500"><Activity size={140} /></div>
                            <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-1 relative z-10">Total Allocated (MTD)</p>
                            <h3 className="text-4xl font-black tracking-tight relative z-10">{reportData.length > 0 ? fmt(reportData.reduce((sum, item) => sum + Math.abs(item.debitTotal || 0), 0)) : '₹0.00'}</h3>
                            <span className="text-[10px] font-bold text-emerald-100 relative z-10 mt-auto bg-white/10 px-3 py-1 rounded-lg w-fit">Period-to-date Expenses</span>
                        </div>
                    </div>

                    {/* Search & List */}
                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden mt-8">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="relative w-full max-w-md group">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Filter cost centers by name, type..."
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm placeholder:text-slate-400"
                                />
                            </div>
                            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider hidden sm:block border border-blue-100/50">
                                {centers.length} Active Centers
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[800px]">
                                <thead className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100 bg-slate-50/20">
                                    <tr>
                                        <th className="px-8 py-5">Name</th>
                                        <th className="px-8 py-5">Category</th>
                                        <th className="px-8 py-5">Status</th>
                                        <th className="px-8 py-5 text-right">Current Balance</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-[13px] font-semibold text-slate-700 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="p-24 text-center">
                                                <div className="flex flex-col items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                                                    <RefreshCcw size={20} className="animate-spin text-blue-500" />
                                                    Loading Units...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-12 text-center bg-slate-50/20">
                                                <div className="max-w-2xl mx-auto flex flex-col items-center py-16 px-8 border-2 border-dashed border-slate-200/85 rounded-3xl bg-white shadow-2xl shadow-slate-200/20">
                                                    <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-md shadow-indigo-100/20 relative animate-pulse">
                                                        <Target size={36} className="text-indigo-600"/>
                                                    </div>
                                                    <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Setup Your First Cost Center</h3>
                                                    <p className="text-slate-400 font-bold text-xs max-w-md mb-8 leading-relaxed">
                                                        Cost Centers allow you to track revenue and expenses for departments, projects, or branches without cluttering your core Chart of Accounts.
                                                     </p>
                                                    <div className="flex gap-4">
                                                        <button 
                                                            onClick={handleOpenCreate}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                                                        >
                                                            <Plus size={16} strokeWidth={2.5}/> Create Cost Center
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={handleLoadDemoData}
                                                            className="bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                                                        >
                                                            <RefreshCcw size={14}/> Load Demo Data
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map(center => (
                                            <tr key={center.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all shadow-sm">
                                                            <Building2 size={18}/>
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 flex items-center gap-2">
                                                                {center.name}
                                                                {center.ParentCostCenter && (
                                                                    <span className="px-2 py-0.5 bg-slate-100 text-[9px] text-slate-500 font-extrabold uppercase rounded tracking-wider border border-slate-200">
                                                                        sub of {center.ParentCostCenter.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="bg-slate-50 text-slate-600 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider border border-slate-100">
                                                        {center.category || 'General'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider border border-emerald-100">
                                                        Active
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right font-bold text-slate-900">
                                                    {reportLoading ? (
                                                        <span className="inline-block w-16 h-4 bg-slate-100 animate-pulse rounded"></span>
                                                    ) : (() => {
                                                        const report = reportData.find(r => r.costCenterId === center.id);
                                                        return report ? fmt(Math.abs(report.netAmount || 0)) : '₹0.00';
                                                    })()}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleOpenEdit(center)}
                                                            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm flex items-center justify-center"
                                                        >
                                                            <Edit2 size={14}/>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(center.id)}
                                                            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm flex items-center justify-center"
                                                        >
                                                            <Trash2 size={14}/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                /* Report View */
                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden mt-8">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText size={18} className="text-blue-600" />
                            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Cost Center Allocation Metrics</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-slate-50/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                              <tr>
                                <th className="px-8 py-5">Cost Center Name</th>
                                <th className="px-6 py-5">Category</th>
                                <th className="px-6 py-5 text-right">Total Debit (Expenses)</th>
                                <th className="px-6 py-5 text-right">Total Credit (Income)</th>
                                <th className="px-8 py-5 text-right">Net Amount</th>
                              </tr>
                            </thead>
                            <tbody className="text-[12px] text-slate-600 divide-y divide-slate-100 bg-white">
                              {reportLoading ? (
                                <tr>
                                  <td colSpan={5} className="text-center py-20">
                                    <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Aggregating Transaction Data...</span>
                                  </td>
                                </tr>
                              ) : reportData.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="text-center py-20">
                                    <div className="max-w-md mx-auto flex flex-col items-center py-12 px-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-slate-400 shadow-sm border border-slate-100">
                                        <FileText size={24} className="text-slate-500" />
                                      </div>
                                      <h4 className="text-base font-black text-slate-800 mb-1 tracking-tight">No Transaction Allocations</h4>
                                      <p className="text-slate-400 text-xs font-semibold text-center max-w-xs leading-relaxed">
                                        Post journal vouchers or invoices and tag items to your cost centers to see financial allocation metrics here.
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                reportData.map((row) => (
                                  <tr key={row.costCenterId} className="hover:bg-slate-50/50 transition-all font-semibold">
                                    <td className="px-8 py-5 font-bold text-slate-900">{row.costCenterName}</td>
                                    <td className="px-6 py-5">
                                      <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-bold uppercase text-slate-500 rounded border border-slate-200">
                                        {row.category}
                                      </span>
                                    </td>
                                    <td className="px-6 py-5 text-right text-rose-600">{fmt(row.debitTotal)}</td>
                                    <td className="px-6 py-5 text-right text-emerald-600">{fmt(row.creditTotal)}</td>
                                    <td className={`px-8 py-5 text-right font-black ${row.netAmount >= 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                      {fmt(Math.abs(row.netAmount))} {row.netAmount >= 0 ? 'Dr' : 'Cr'}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Creation/Edit Modal */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="absolute inset-0" onClick={() => setShowModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white shadow-2xl rounded-[2rem] overflow-hidden border border-slate-100 animate-slide-up">
                        <header className="px-8 pt-8 pb-4 flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                        <Briefcase size={14} />
                                    </div>
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50/50 px-2.5 py-1 rounded-md border border-blue-100/50">Resource Allocation</span>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">{editMode ? 'Edit Center' : 'New Cost Center'}</h3>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setShowModal(false)} 
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </header>
                        
                        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Center Name <span className="text-rose-500">*</span></label>
                                <input 
                                    type="text" 
                                    required 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Marketing Dept, Project Alpha"
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold text-slate-900 placeholder:text-slate-300 transition-all text-xs"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Category <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <select 
                                            value={category}
                                            onChange={e => setCategory(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold text-slate-900 transition-all text-xs cursor-pointer appearance-none pr-10"
                                        >
                                            <option value="General">General</option>
                                            <option value="Department">Department</option>
                                            <option value="Project">Project</option>
                                            <option value="Branch">Branch</option>
                                        </select>
                                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Hierarchy Link</label>
                                    <div className="relative">
                                        <select 
                                            value={parentCostCenterId}
                                            onChange={e => setParentCostCenterId(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold text-slate-900 transition-all text-xs cursor-pointer appearance-none pr-10"
                                        >
                                            <option value="">No Parent (Root)</option>
                                            {centers
                                              .filter(c => c.id !== editId)
                                              .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                            }
                                        </select>
                                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Description (Optional)</label>
                                <textarea 
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Add notes, context, or internal identifiers..."
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-semibold text-slate-700 placeholder:text-slate-300 transition-all min-h-[90px] text-xs resize-none"
                                />
                            </div>
                            
                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)} 
                                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:shadow-blue-600/35 transition-all active:scale-[0.98]"
                                >
                                    {editMode ? 'Save' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default CostCenterView;
