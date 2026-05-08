import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Trash2, LayoutGrid, 
  Activity, Briefcase, RefreshCcw, AlertCircle,
  Building2, Users2, Target
} from 'lucide-react';
import { costCenterAPI } from '../../services/api';

const CostCenterView = ({ showNew }) => {
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(showNew || false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const companyId = localStorage.getItem('companyId');

    const fetchCenters = useCallback(async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const res = await costCenterAPI.getByCompany(companyId);
            setCenters(Array.isArray(res.data) ? res.data : []);
        } catch (err) { console.error(err); }
        setLoading(false);
    }, [companyId]);

    useEffect(() => { fetchCenters(); }, [fetchCenters]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await costCenterAPI.create({ 
                name, 
                description, 
                CompanyId: companyId 
            });
            setName('');
            setDescription('');
            setShowModal(false);
            fetchCenters();
        } catch (err) { alert('Failed to create cost center'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this cost center?')) return;
        try {
            await costCenterAPI.delete(id);
            fetchCenters();
        } catch (err) { alert('Delete failed'); }
    };

    const filtered = centers.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-10 max-w-[1200px] mx-auto space-y-8 animate-fade-in">
            
            {/* Header */}
            <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                <div>
                   <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                         <Target size={20}/>
                      </div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Resource Allocation</span>
                   </div>
                   <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">Cost Centers</h1>
                   <p className="text-sm text-slate-500 mt-1">Track financials by Project, Department, or Business Unit.</p>
                </div>
                <div className="flex gap-3">
                   <button onClick={fetchCenters} className="p-3 border border-slate-100 rounded-xl bg-white hover:bg-slate-50 text-slate-400"><RefreshCcw size={18}/></button>
                   <button 
                      onClick={() => setShowModal(true)}
                      className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:-translate-y-0.5 transition-all"
                   >
                      <Plus size={16}/> New Center
                   </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<Briefcase size={20}/>} label="Total Centers" value={centers.length} color="indigo" />
                <StatCard icon={<Target size={20}/>}    label="Active Projects" value={centers.length} color="emerald" />
                <StatCard icon={<Users2 size={20}/>}    label="Allocations" value="Professional" color="blue" />
            </div>

            {/* Search & List */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                    <div className="relative max-w-md">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Filter cost centers..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500/30 transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="divide-y divide-slate-50">
                    {loading ? (
                        <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest animate-pulse">Loading Units...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                                <LayoutGrid size={32}/>
                            </div>
                            <p className="text-slate-400 font-bold">No Cost Centers found.</p>
                        </div>
                    ) : (
                        filtered.map(center => (
                            <div key={center.id} className="p-6 hover:bg-slate-50/50 transition-all flex items-center justify-between group">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors shadow-sm">
                                        <Building2 size={20}/>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-slate-900 leading-tight">{center.name}</div>
                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {center.id.substring(0,8)}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Description</div>
                                        <div className="text-sm font-bold text-slate-500">{center.description || '—'}</div>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(center.id)}
                                        className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Creation Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-zoom-in">
                        <header className="px-8 py-6 bg-slate-50 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">New Cost Center</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Resource Initialization</p>
                        </header>
                        <form onSubmit={handleCreate} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Center Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Marketing, Project X..."
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-500/30 focus:bg-white font-bold text-slate-900 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notes (Optional)</label>
                                <textarea 
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-500/30 focus:bg-white font-bold text-slate-900 transition-all min-h-[100px]"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 border-2 border-slate-50 rounded-2xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:-translate-y-1 transition-all">Create Unit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-${color}-600 bg-${color}-50 shadow-inner`}>
            {icon}
        </div>
        <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{label}</div>
            <div className="text-2xl font-bold text-slate-900 tracking-tighter">{value}</div>
        </div>
    </div>
);

export default CostCenterView;
