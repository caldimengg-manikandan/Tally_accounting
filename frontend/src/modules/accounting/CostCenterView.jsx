import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Search, Trash2, Edit2, LayoutGrid, 
  Activity, Briefcase, RefreshCcw, AlertCircle,
  Building2, Users2, Target, X, FileText
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
    }, [fetchCenters]);

    useEffect(() => {
        if (activeTab === 'report') {
            fetchReport();
        }
    }, [activeTab, fetchReport]);

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
            if (activeTab === 'report') fetchReport();
        } catch (err) { 
            alert(editMode ? 'Failed to update cost center' : 'Failed to create cost center'); 
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this cost center?')) return;
        try {
            await costCenterAPI.delete(id);
            fetchCenters();
            if (activeTab === 'report') fetchReport();
        } catch (err) { alert('Delete failed'); }
    };

    const filtered = centers.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.category || '').toLowerCase().includes(search.toLowerCase())
    );

    const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in font-sans min-h-[calc(100vh-80px)]">
            
            {/* Header */}
            <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                <div>
                   <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm">
                         <Target size={18}/>
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em]">Resource Allocation</span>
                   </div>
                   <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Cost Centers</h1>
                   <p className="text-slate-400 text-xs font-semibold mt-2">Track financials by Project, Department, or Business Unit.</p>
                </div>
                <div className="flex gap-3">
                   <button 
                     onClick={() => activeTab === 'report' ? fetchReport() : fetchCenters()} 
                     className="p-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-all shadow-sm"
                   >
                     <RefreshCcw size={18} className={(loading || reportLoading) ? 'animate-spin' : ''} />
                   </button>
                   <button 
                      onClick={handleOpenCreate}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/15 hover:shadow-blue-600/30 transition-all active:scale-[0.98] flex items-center gap-1.5"
                   >
                      <Plus size={16}/> New Center
                   </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('directory')}
                  className={`px-6 py-3 text-sm font-bold tracking-tight border-b-2 transition-all ${activeTab === 'directory' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                >
                  Centers Directory
                </button>
                <button
                  onClick={() => setActiveTab('report')}
                  className={`px-6 py-3 text-sm font-bold tracking-tight border-b-2 transition-all ${activeTab === 'report' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                >
                  Allocations Report
                </button>
            </div>

            {activeTab === 'directory' ? (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard icon={<Briefcase size={20}/>} label="Total Centers" value={centers.length} color="blue" />
                        <StatCard icon={<Target size={20}/>}    label="Categories" value={new Set(centers.map(c => c.category)).size} color="blue" />
                        <StatCard icon={<Users2 size={20}/>}    label="Allocations" value="Professional" color="blue" />
                    </div>

                    {/* Search & List */}
                    <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                            <div className="relative max-w-md group">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Filter cost centers..."
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100/60">
                            {loading ? (
                                <div className="p-24 text-center text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse flex flex-col items-center gap-3">
                                    <RefreshCcw size={20} className="animate-spin text-blue-500" />
                                    Loading Units...
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="p-20 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 border border-slate-100">
                                        <LayoutGrid size={28}/>
                                    </div>
                                    <p className="text-slate-400 font-bold text-sm">No Cost Centers found.</p>
                                </div>
                            ) : (
                                filtered.map(center => (
                                    <div key={center.id} className="px-8 py-5 hover:bg-slate-50/40 transition-all flex items-center justify-between group">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-slate-50/50 border border-slate-100/80 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50/50 group-hover:border-blue-100/50 transition-all duration-300 shadow-sm">
                                                <Building2 size={20}/>
                                            </div>
                                            <div>
                                                <div className="text-[14px] font-bold text-slate-900 leading-snug flex items-center gap-2">
                                                    {center.name}
                                                    {center.ParentCostCenter && (
                                                        <span className="px-2 py-0.5 bg-slate-150 text-[9px] text-slate-500 font-extrabold uppercase rounded tracking-wider">
                                                            sub of {center.ParentCostCenter.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Category: {center.category || 'General'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right hidden sm:block">
                                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Description</div>
                                                <div className="text-[13px] font-bold text-slate-500">{center.description || '—'}</div>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleOpenEdit(center)}
                                                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all duration-200 shadow-sm flex items-center justify-center"
                                                >
                                                    <Edit2 size={15}/>
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(center.id)}
                                                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-200 shadow-sm flex items-center justify-center"
                                                >
                                                    <Trash2 size={16}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            ) : (
                /* Report View */
                <div className="bg-white rounded-[28px] border border-slate-200 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText size={18} className="text-blue-600" />
                            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Cost Center Allocation Metrics</span>
                        </div>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/30 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                          <tr>
                            <th className="px-8 py-4">Cost Center Name</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4 text-right">Total Debit (Expenses)</th>
                            <th className="px-6 py-4 text-right">Total Credit (Income)</th>
                            <th className="px-8 py-4 text-right">Net Amount</th>
                          </tr>
                        </thead>
                        <tbody className="text-[12px] text-slate-600 divide-y divide-slate-50">
                          {reportLoading ? (
                            <tr>
                              <td colSpan={5} className="text-center py-20">
                                <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Aggregating Transaction Data...</span>
                              </td>
                            </tr>
                          ) : reportData.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-20 text-slate-400 italic">No transactions tagged to cost centers</td>
                            </tr>
                          ) : (
                            reportData.map((row) => (
                              <tr key={row.costCenterId} className="hover:bg-slate-50/50 transition-all">
                                <td className="px-8 py-4 font-bold text-slate-900">{row.costCenterName}</td>
                                <td className="px-6 py-4">
                                  <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-bold uppercase text-slate-500 rounded border border-slate-200">
                                    {row.category}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right font-semibold text-rose-600">{fmt(row.debitTotal)}</td>
                                <td className="px-6 py-4 text-right font-semibold text-emerald-600">{fmt(row.creditTotal)}</td>
                                <td className={`px-8 py-4 text-right font-black ${row.netAmount >= 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                  {fmt(Math.abs(row.netAmount))} {row.netAmount >= 0 ? 'Dr' : 'Cr'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Creation/Edit Modal */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300" onClick={() => setShowModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white/95 backdrop-blur-lg shadow-2xl border border-white/50 rounded-[28px] overflow-hidden transform transition-all scale-100 animate-zoom-in flex flex-col">
                        <header className="px-8 py-6 border-b border-slate-100/80 bg-slate-50/40 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                                    <Target size={20} />
                                </div>
                                <div>
                                    <h3 className="text-[17px] font-black text-slate-900 leading-tight">{editMode ? 'Edit Cost Center' : 'Create Cost Center'}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Resource Allocation</p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setShowModal(false)} 
                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-full transition-all border border-transparent hover:border-slate-200"
                            >
                                <X size={18} />
                            </button>
                        </header>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Center Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Marketing, Project X..."
                                    className="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500/20 focus:bg-white font-bold text-slate-800 placeholder:text-slate-400 transition-all font-sans text-xs"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Category</label>
                                <select 
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500/20 focus:bg-white font-bold text-slate-800 transition-all font-sans text-xs"
                                >
                                    <option value="General">General</option>
                                    <option value="Department">Department</option>
                                    <option value="Project">Project</option>
                                    <option value="Branch">Branch</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Parent Cost Center (Optional)</label>
                                <select 
                                    value={parentCostCenterId}
                                    onChange={e => setParentCostCenterId(e.target.value)}
                                    className="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500/20 focus:bg-white font-bold text-slate-800 transition-all font-sans text-xs"
                                >
                                    <option value="">No Parent (Primary)</option>
                                    {centers
                                      .filter(c => c.id !== editId) // avoid self-referencing
                                      .map(c => <option key={c.id} value={c.id}>{c.name} ({c.category})</option>)
                                    }
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Notes (Optional)</label>
                                <textarea 
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Add optional notes..."
                                    className="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500/20 focus:bg-white font-bold text-slate-800 placeholder:text-slate-400 transition-all min-h-[80px] font-sans text-xs"
                                />
                            </div>
                            
                            <div className="flex gap-4 pt-4 border-t border-slate-100/50">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all font-sans">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-600/15 hover:shadow-blue-600/30 transition-all font-sans active:scale-95">
                                    {editMode ? 'Save Changes' : 'Create Unit'}
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

const StatCard = ({ icon, label, value, color }) => {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-50/70 border-blue-100/50',
        emerald: 'text-emerald-600 bg-emerald-50/70 border-emerald-100/50'
    };
    const currentClass = colorClasses[color] || colorClasses.blue;
    return (
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${currentClass}`}>
                {icon}
            </div>
            <div className="space-y-1">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.15em]">{label}</div>
                <div className="text-3xl font-black text-slate-950 tracking-tight leading-none">{value}</div>
            </div>
        </div>
    );
};

export default CostCenterView;
