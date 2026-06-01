import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronRight, ChevronDown, Plus, 
    RefreshCcw, Search, MoreHorizontal, 
    Wallet, Shield, ArrowUpRight, ArrowDownRight, Activity, BarChart4,
    Folder, FileText, CornerDownRight, BookOpen, Edit
} from 'lucide-react';
import { groupAPI, ledgerAPI } from '../../services/api';

const LedgersView = ({ showNew }) => {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDrawer, setShowDrawer] = useState(showNew || false);
    const [editingId, setEditingId] = useState(null);
    const [seeding, setSeeding] = useState(false);
    const [seedStatus, setSeedStatus] = useState(null); // 'success' | 'error' | null
    
    // Flattened list for the Parent select dropdown
    const [flatGroupList, setFlatGroupList] = useState([]);
    
    const [formData, setFormData] = useState({ 
        name: '', nature: 'Assets', type: 'Ledger', parent_id: '', description: '', openingBalance: '', openingBalanceType: 'Dr'
    });
    const companyId = localStorage.getItem('companyId');
    const user = React.useMemo(() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } }, []);
    const role = user.role || 'ADMIN';
    const canCreate = !['VIEWER', 'AUDITOR', 'DATA_ENTRY'].includes(role);
    const canDelete = !['VIEWER', 'AUDITOR', 'DATA_ENTRY'].includes(role); // Only Admins/Managers/Accountants can delete accounts


    const buildHierarchy = (flatGroups) => {
        const map = {};
        flatGroups.forEach(g => map[g.id] = { ...g, children: [] });
        const roots = [];
        flatGroups.forEach(g => {
            if (g.parent_id && map[g.parent_id]) {
                map[g.parent_id].children.push(map[g.id]);
            } else {
                roots.push(map[g.id]);
            }
        });
        return roots;
    };

    const fetchData = async () => {
        const currentCompanyId = localStorage.getItem('companyId');
        if (!currentCompanyId) return;
        setLoading(true);
        try {
            const res = await groupAPI.getByCompany(currentCompanyId);
            const flat = res.data || [];
            
            // Auto-sort alphabetically for absolute professionalism
            const sortedFlat = flat.sort((a,b) => a.name.localeCompare(b.name));
            
            setFlatGroupList(sortedFlat);
            setGroups(buildHierarchy(sortedFlat));
            console.log(`[LedgersView] Fetched ${sortedFlat.length} groups for Company ID: ${currentCompanyId}`);
        } catch (err) { 
            console.error("[LedgersView] Error fetching data:", err); 
        }
        setLoading(false);
    };

    const handleSeedGroups = async () => {
        const currentId = localStorage.getItem('companyId');
        if (!currentId || seeding) {
            setSeedStatus('error');
            setTimeout(() => setSeedStatus(null), 5000);
            return;
        }
        setSeeding(true);
        setSeedStatus(null);
        setError(null);
        try {
            await groupAPI.seedStandard(currentId);
            setSeedStatus('success');
            setTimeout(() => setSeedStatus(null), 3000);
            await fetchData();
        } catch (err) { 
            console.error(err); 
            const msg = err.response?.data?.error || 'Initialization Failed. Try again or check server.';
            setSeedStatus('error');
            setError(msg);
            setTimeout(() => { setSeedStatus(null); setError(null); }, 8000);
        }
        setSeeding(false);
    };

    const resolveAndFetch = async () => {
        try {
            // First, ensure we have a valid companyId
            if (!localStorage.getItem('companyId')) {
                const res = await groupAPI.resolveGroups();
                if (res.data?.companyId) {
                    localStorage.setItem('companyId', res.data.companyId);
                }
            }
            await fetchData();
        } catch (err) { console.error(err); }
    };

    useEffect(() => { 
        resolveAndFetch(); 
    }, []);

    // Refresh data whenever drawer opens to ensure we have the latest group list
    useEffect(() => {
        if (showDrawer) fetchData();
    }, [showDrawer]);

    const toggleGroup = (e, id) => {
        e.stopPropagation();
        const newSet = new Set(expandedGroups);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedGroups(newSet);
    };

    const openDrawerWithParent = (parentId) => {
        const selectedGrp = flatGroupList.find(g => String(g.id) === String(parentId));
        setFormData({ 
            ...formData, 
            parent_id: parentId,
            nature: selectedGrp ? selectedGrp.nature : formData.nature,
            type: 'Ledger'
        });
        setShowDrawer(true);
    };

    const handleDeleteLedger = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this ledger?")) return;
        try {
            await ledgerAPI.delete(id);
            fetchData();
        } catch (err) { alert("Delete failed: " + (err.response?.data?.error || err.message)); }
    };

    const handleDeleteGroup = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this group and its contents?")) return;
        try {
            await groupAPI.delete(id);
            fetchData();
        } catch (err) { alert("Delete failed: " + (err.response?.data?.error || err.message)); }
    };

    const matchesSearch = (item) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const selfMatch = item.name.toLowerCase().includes(q);
        const childMatch = item.children?.some(c => matchesSearch(c));
        const ledgerMatch = item.Ledgers?.some(l => l.name.toLowerCase().includes(q));
        return selfMatch || childMatch || ledgerMatch;
    };

    const highlightText = (text, query) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) => 
                    part.toLowerCase() === query.toLowerCase() 
                    ? <span key={i} className="bg-blue-100 text-blue-900 px-0.5 rounded font-bold">{part}</span> 
                    : part
                )}
            </span>
        );
    };

    const handleStartEdit = (node, type) => {
        setEditingId(node.id);
        setFormData({
            name: node.name,
            nature: node.nature || 'Assets',
            type: type,
            parent_id: type === 'Ledger' ? (node.GroupId || '') : (node.parent_id || ''),
            description: node.description || '',
            openingBalance: node.openingBalance || '',
            openingBalanceType: node.openingBalanceType || 'Dr'
        });
        setShowDrawer(true);
    };

    const handleCloseDrawer = () => {
        setShowDrawer(false);
        setEditingId(null);
        setFormData({ name: '', nature: 'Assets', type: 'Ledger', parent_id: '', description: '', openingBalance: '', openingBalanceType: 'Dr' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const currentCompanyId = localStorage.getItem('companyId');
        if (!currentCompanyId) return;
        
        try {
            const payload = { ...formData, CompanyId: currentCompanyId };
            // Standardize empty parent_id to null
            if (!payload.parent_id || payload.parent_id === '') payload.parent_id = null;

            if (editingId) {
                if (formData.type === 'Group') {
                    await groupAPI.update(editingId, payload);
                } else {
                    payload.groupId = payload.parent_id; 
                    await ledgerAPI.update(editingId, payload);
                }
            } else {
                if (formData.type === 'Group') {
                    await groupAPI.create(payload);
                } else {
                    // IMPORTANT: Ledgers expect 'groupId', but groups expect 'parent_id'
                    payload.groupId = payload.parent_id; 
                    await ledgerAPI.create(payload);
                }
            }
            setShowDrawer(false);
            setEditingId(null);
            setFormData({ name: '', nature: 'Assets', type: 'Ledger', parent_id: '', description: '', openingBalance: '', openingBalanceType: 'Dr' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
    };

    const getNodeBalance = (node, isGroup) => {
        if (!isGroup) return Number(node.currentBalance || node.openingBalance || 0);
        let total = 0;
        if (node.children) {
            node.children.forEach(child => { total += getNodeBalance(child, true); });
        }
        if (node.Ledgers) {
            node.Ledgers.forEach(ledger => { total += getNodeBalance(ledger, false); });
        }
        return total;
    };

    // --- RECURSIVE RENDERER (TABLE ROW STYLE) ---
    const renderNode = (node, type = 'group', depth = 0) => {
        if (depth > 12) return null; // Safe guard

        const isGroup = type === 'group';
        const isExpanded = expandedGroups.has(node.id) || (searchQuery && matchesSearch(node));
        const hasChildren = isGroup && ((node.Ledgers && node.Ledgers.length > 0) || (node.children && node.children.length > 0));

        const filteredChildren = isGroup ? (node.children?.filter(child => matchesSearch(child)) || []) : [];
        const filteredLedgers = isGroup ? (node.Ledgers?.filter(ledger => ledger.name.toLowerCase().includes(searchQuery.toLowerCase())) || []) : [];

        // Hide node if it doesn't match search
        if (searchQuery && isGroup && !matchesSearch(node) && filteredChildren.length === 0 && filteredLedgers.length === 0) return null;

        // Base structural styling
        const paddingLeft = depth * 32 + 20;

        return (
            <div key={`${type}-${node.id}`} className="select-none animate-fade-in text-sm border-b border-slate-100/50">
                <div 
                    onClick={(e) => {
                        if (isGroup) {
                            toggleGroup(e, node.id);
                        } else {
                            navigate(`/ledger-statement/${node.id}`);
                        }
                    }}
                    className={`flex items-center group py-2.5 transition-all duration-200 cursor-pointer border-l-4
                        ${isGroup 
                            ? 'hover:bg-slate-50 border-transparent hover:border-blue-400' 
                            : 'hover:bg-blue-50/50 border-transparent hover:border-indigo-400'}`}
                >
                    {/* COL 1: NAME & HIERARCHY */}
                    <div className="flex-1 flex items-center gap-2" style={{ paddingLeft: `${paddingLeft}px` }}>
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            {isGroup ? (
                                hasChildren ? (
                                    <button 
                                        onClick={(e) => toggleGroup(e, node.id)} 
                                        className="w-5 h-5 rounded hover:bg-slate-200 text-slate-400 hover:text-blue-600 transition-all flex items-center justify-center"
                                    >
                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); openDrawerWithParent(node.id); }}
                                        title="Quick Add Ledger"
                                        className="w-5 h-5 rounded hover:bg-blue-100/50 text-slate-300 hover:text-blue-600 transition-all flex items-center justify-center group/plus relative"
                                    >
                                        <ChevronRight size={14} className="group-hover/plus:opacity-0 transition-opacity" />
                                        <Plus size={14} className="absolute opacity-0 group-hover/plus:opacity-100 transition-opacity" />
                                    </button>
                                )
                            ) : (
                                <div className="w-5 h-5 flex items-center justify-center">
                                    <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            )}
                        </div>
                        
                        {isGroup ? <Folder size={14} className="text-blue-500 shrink-0" /> : <FileText size={14} className="text-slate-400 shrink-0" />}
                        
                        <span className={`truncate w-full pr-4 tracking-tight ${isGroup ? 'font-bold text-slate-800' : 'font-medium text-slate-600 italic'}`}>
                            {highlightText(node.name, searchQuery)}
                        </span>
                    </div>

                    {/* COL 2: TYPE */}
                    <div className="w-40 shrink-0 flex items-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border
                            ${isGroup ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-transparent text-slate-400 border-transparent group-hover:border-slate-200'}`}>
                            {isGroup ? 'Group' : 'Ledger'}
                        </span>
                    </div>

                    {/* COL 3: NATURE */}
                    <div className="w-40 shrink-0 flex items-center">
                        {(isGroup || node.nature) && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border
                                ${node.nature?.toLowerCase() === 'assets' ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200' :
                                  node.nature?.toLowerCase() === 'liabilities' ? 'bg-rose-100/50 text-rose-700 border-rose-200' :
                                  node.nature?.toLowerCase() === 'income' ? 'bg-indigo-100/50 text-indigo-700 border-indigo-200' : 
                                  node.nature?.toLowerCase() === 'expenses' ? 'bg-amber-100/50 text-amber-700 border-amber-200' :
                                  'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                {node.nature || 'PRIMARY'}
                            </span>
                        )}
                        {!isGroup && !node.nature && <span className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">—</span>}
                    </div>

                    {/* COL 4: BALANCE + ACTIONS */}
                    <div className="w-56 shrink-0 pr-4 flex items-center justify-end gap-3">
                        <span className={`text-[13px] ${isGroup ? 'font-bold text-slate-900 border-b border-slate-200' : 'font-bold text-slate-700'}`}>
                            {formatCurrency(getNodeBalance(node, isGroup))}
                        </span>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            {!isGroup && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/ledger-statement/${node.id}`); }}
                                    title="View Statement"
                                    className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                                >
                                    <BookOpen size={14} />
                                </button>
                            )}
                            
                            {canCreate && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleStartEdit(node, isGroup ? 'Group' : 'Ledger'); }}
                                    title={isGroup ? "Edit Group" : "Edit Ledger"}
                                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                                >
                                    <Edit size={14} />
                                </button>
                            )}

                            {canDelete && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        isGroup ? handleDeleteGroup(e, node.id) : handleDeleteLedger(e, node.id);
                                    }}
                                    title={isGroup ? "Delete Group" : "Delete Ledger"}
                                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                                >
                                    <Activity size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* RENDER CHILDREN IF EXPANDED */}
                {isGroup && isExpanded && (
                    <div className="flex flex-col">
                        {filteredChildren.map(child => renderNode({ ...child, nature: child.nature || node.nature }, 'group', depth + 1))}
                        {filteredLedgers.map(ledger => renderNode({ ...ledger, nature: ledger.nature || node.nature }, 'ledger', depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    // role-based access is already defined at the top

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] bg-slate-50 p-6 font-sans">
            
            {/* ══ HEADER & METRICS (ZOHO STYLE) ═════════════════════════ */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        LEDGERS
                    </h1>
                   <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                       <Activity size={14}/> Professional hierarchy and ledger management
                   </p>
                </div>
                <div className="flex gap-3">
                   <button onClick={fetchData} className="px-4 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold shadow-sm transition-all flex items-center gap-2">
                       <RefreshCcw size={14}/> Sync
                   </button>
                   {canCreate && (
                    <button 
                       onClick={() => {
                           setEditingId(null);
                           setFormData({ name: '', nature: 'Assets', type: 'Ledger', parent_id: '', description: '', openingBalance: '', openingBalanceType: 'Dr' });
                           setShowDrawer(true);
                       }}
                       className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold text-sm shadow-sm hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                       <Plus size={16}/> New Account
                    </button>
                   )}
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Assets', value: groups.filter(g => g.nature === 'Assets').length, title: 'Asset Groups' },
                    { label: 'Total Liabilities', value: groups.filter(g => g.nature === 'Liabilities').length, title: 'Liability Groups' },
                    { label: 'Income & Expense', value: groups.filter(g => ['Income','Expenses'].includes(g.nature)).length, title: 'Revenue Groups' },
                    { label: 'Active Ledgers', value: flatGroupList.reduce((acc, g) => acc + (g.Ledgers?.length || 0), 0), title: 'Total Ledgers' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</div>
                        <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium select-none">{stat.title}</div>
                    </div>
                ))}
            </div>

            {/* ══ DATA GRID (ZOHO/TALLY STYLE) ═════════════════════════ */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                {/* TOOLBAR */}
                <div className="h-14 px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4 w-96">
                       <div className="relative w-full">
                          <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${searchQuery ? 'text-blue-500' : 'text-slate-400'}`} />
                          <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter accounts..." 
                            className="w-full pl-9 pr-3 border border-slate-200 bg-white rounded-lg h-9 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm placeholder:text-slate-400"
                          />
                       </div>
                    </div>
                   <div className="flex items-center gap-3">
                      <button className="h-9 px-3 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-500 text-sm font-medium flex items-center gap-2 shadow-sm">
                          <Folder size={14}/> Collapse All
                      </button>
                   </div>
                </div>

                {/* TABLE HEADER */}
                <div className="flex bg-slate-100/50 border-b border-slate-200 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
                    <div className="flex-1 pl-[4.5rem]">Account Name</div>
                    <div className="w-40">Record Type</div>
                    <div className="w-40">Nature</div>
                    <div className="w-48 pr-10 text-right">Balance</div>
                </div>
                
                {/* TABLE BODY */}
                <div className="flex-1 overflow-y-auto">
                   {loading ? (
                       <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                           <RefreshCcw size={24} className="animate-spin text-blue-500"/>
                           <span className="text-sm font-medium uppercase tracking-widest">Loading Hierarchy...</span>
                       </div>
                   ) : groups.length === 0 ? (
                       <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                           <BarChart4 size={32} className="text-slate-300"/>
                           <span className="text-sm font-medium uppercase tracking-widest">No Accounts Found</span>
                       </div>
                   ) : (
                       // Render roots
                       groups.filter(g => !g.parent_id).map(group => renderNode(group, 'group', 0))
                   )}
                </div>
            </div>

            {/* ══ CREATION MODAL ══════════════════════════════════════ */}
            {showDrawer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowDrawer(false)}></div>
                    <div className="relative w-full max-w-[480px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 animate-fade-in flex flex-col overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                           <div>
                              <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Edit Account Node' : 'Create Account Node'}</h2>
                              <span className="text-xs text-slate-500 font-medium mt-1">{editingId ? 'Modify details of the selected group or ledger' : 'Add a new ledger or hierarchical group'}</span>
                           </div>
                           <button onClick={handleCloseDrawer} className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">

                           {/* Warning if no company selected */}
                           {!localStorage.getItem('companyId') && (
                               <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                                   <div className="flex-1">
                                       <p className="text-sm font-bold text-rose-800">No Company Active!</p>
                                       <p className="text-xs text-rose-600 mt-1">Please select or create a company in the Settings first.</p>
                                   </div>
                               </div>
                           )}

                           {/* Seed Warning if empty */}
                           {localStorage.getItem('companyId') && flatGroupList.length === 0 && !seeding && !seedStatus && (
                               <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                                   <div className="flex-1">
                                       <p className="text-sm font-bold text-amber-800">No groups found!</p>
                                       <p className="text-xs text-amber-600 mt-1">Initialize the standard Tally groups to continue.</p>
                                   </div>
                                   <button 
                                       type="button" 
                                       onClick={handleSeedGroups}
                                       className="px-4 py-2 bg-amber-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-amber-700 shadow-md active:scale-95 transition-all"
                                   >
                                       Initialize
                                   </button>
                               </div>
                           )}

                           {seeding && (
                               <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 animate-pulse">
                                   <RefreshCcw size={16} className="animate-spin text-blue-500" />
                                   <p className="text-sm font-bold text-blue-700">Setting up standard groups...</p>
                               </div>
                           )}

                           {seedStatus === 'success' && (
                               <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                                   <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                       <Activity size={12} className="text-white" />
                                   </div>
                                   <p className="text-sm font-bold text-emerald-700">Groups Initialized Successfully!</p>
                               </div>
                           )}

                           {seedStatus === 'error' && (
                               <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-3">
                                   <div className="flex items-center gap-3">
                                       <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center">
                                           <Shield size={12} className="text-white" />
                                       </div>
                                       <p className="text-sm font-bold text-rose-700">{error || 'Initialization Failed.'}</p>
                                   </div>
                                   {error?.includes('Company not found') && (
                                       <button 
                                          type="button"
                                          onClick={() => window.location.href='/settings/company'}
                                          className="text-[10px] uppercase font-bold tracking-widest bg-rose-600 text-white px-3 py-2 rounded-lg hover:bg-rose-700 transition-all self-start"
                                       >
                                          Go to Company Setup
                                       </button>
                                   )}
                               </div>
                           )}

                            <div className="space-y-4">
                               {/* RECORD TYPE SELECTOR */}
                               {!editingId && (
                                   <div>
                                       <label className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b] mb-2 px-1">Record Type</label>
                                       <div className="flex gap-4">
                                           <label className={`flex-1 flex items-center justify-center gap-2 h-12 border-2 rounded-xl cursor-pointer transition-all ${formData.type === 'Ledger' ? 'bg-blue-50 border-blue-500' : 'bg-[#f8fafc] border-[#e2e8f0] hover:border-blue-500'}`}>
                                               <input 
                                                   type="radio" 
                                                   name="type" 
                                                   value="Ledger" 
                                                   checked={formData.type === 'Ledger'} 
                                                   onChange={() => setFormData({ ...formData, type: 'Ledger' })}
                                                   className="accent-blue-600"
                                               />
                                               <span className="text-sm font-bold text-[#1e293b]">Ledger</span>
                                           </label>
                                           <label className={`flex-1 flex items-center justify-center gap-2 h-12 border-2 rounded-xl cursor-pointer transition-all ${formData.type === 'Group' ? 'bg-blue-50 border-blue-500' : 'bg-[#f8fafc] border-[#e2e8f0] hover:border-blue-500'}`}>
                                               <input 
                                                   type="radio" 
                                                   name="type" 
                                                   value="Group" 
                                                   checked={formData.type === 'Group'} 
                                                   onChange={() => setFormData({ ...formData, type: 'Group' })}
                                                   className="accent-blue-600"
                                               />
                                               <span className="text-sm font-bold text-[#1e293b]">Group</span>
                                           </label>
                                       </div>
                                   </div>
                               )}

                               {/* LEDGER NAME */}
                               <div>
                                   <label className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b] mb-2 px-1">{formData.type === 'Ledger' ? 'Ledger Name' : 'Group Name'}</label>
                                   <input 
                                       type="text"
                                       required
                                       className="w-full h-14 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl px-6 text-sm font-bold text-[#1e293b] focus:border-[#2563eb] focus:bg-white outline-none transition-all placeholder:text-[#cbd5e1]"
                                       placeholder={formData.type === 'Ledger' ? 'e.g. Rent, Salary...' : 'e.g. Administrative Expenses, Bank Accounts...'}
                                       value={formData.name}
                                       onChange={e => setFormData({ ...formData, name: e.target.value })}
                                   />
                               </div>

                               {/* DESCRIPTION BOX */}
                               <div>
                                   <label className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b] mb-2 px-1">Description / Notes</label>
                                   <textarea 
                                       className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl px-6 py-4 text-sm font-bold text-[#1e293b] focus:border-[#2563eb] focus:bg-white outline-none transition-all placeholder:text-[#cbd5e1] min-h-[80px]"
                                       placeholder="Add any additional details here..."
                                       value={formData.description || ''}
                                       onChange={e => setFormData({ ...formData, description: e.target.value })}
                                   />
                               </div>

                               {/* OPENING BALANCE (ONLY FOR LEDGERS) */}
                               {formData.type === 'Ledger' && (
                                   <div className="flex gap-4">
                                       <div className="flex-1">
                                           <label className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b] mb-2 px-1">Opening Balance</label>
                                           <div className="relative">
                                               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                               <input 
                                                   type="number"
                                                   step="0.01"
                                                   className="w-full h-14 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl pl-10 pr-6 text-sm font-bold text-[#1e293b] focus:border-[#2563eb] focus:bg-white outline-none transition-all placeholder:text-[#cbd5e1]"
                                                   placeholder="0.00"
                                                   value={formData.openingBalance || ''}
                                                   onChange={e => setFormData({ ...formData, openingBalance: e.target.value })}
                                               />
                                           </div>
                                       </div>
                                       <div className="w-32">
                                           <label className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b] mb-2 px-1">Dr / Cr</label>
                                           <select
                                               className="w-full h-14 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl px-4 text-sm font-bold text-[#1e293b] focus:border-[#2563eb] focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                               value={formData.openingBalanceType || 'Dr'}
                                               onChange={e => setFormData({ ...formData, openingBalanceType: e.target.value })}
                                           >
                                               <option value="Dr">Dr</option>
                                               <option value="Cr">Cr</option>
                                           </select>
                                       </div>
                                   </div>
                               )}

                               {/* PARENT SELECTION */}
                               <div>
                                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b] mb-2 px-1 text-slate-500">Under (Select Group)</label>
                                  <select 
                                     value={formData.parent_id || ''}
                                     required
                                     onChange={(e) => {
                                         const selectedId = e.target.value;
                                         const selectedGrp = flatGroupList.find(g => String(g.id) === String(selectedId));
                                         setFormData({
                                             ...formData, 
                                             parent_id: selectedId,
                                             nature: selectedGrp ? selectedGrp.nature : formData.nature
                                         });
                                     }}
                                     className="w-full h-14 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl px-6 text-sm font-bold text-blue-800 focus:border-blue-600 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                  >
                                     <option value="">-- Primary (Root Group) --</option>
                                     {['Assets', 'Liabilities', 'Income', 'Expenses'].map(nature => (
                                         <optgroup key={nature} label={`── ${nature.toUpperCase()} ──`}>
                                             {flatGroupList
                                                 .filter(g => g.nature?.toLowerCase() === nature.toLowerCase())
                                                 .map(g => (
                                                     <option key={g.id} value={g.id}>{g.name}</option>
                                                 ))
                                             }
                                         </optgroup>
                                     ))}
                                     {/* FALLBACK FOR OTHER GROUPS */}
                                     {flatGroupList.filter(g => !['assets', 'liabilities', 'income', 'expenses'].includes(g.nature?.toLowerCase())).length > 0 && (
                                         <optgroup label="── OTHER GROUPS ──">
                                             {flatGroupList
                                                 .filter(g => !['assets', 'liabilities', 'income', 'expenses'].includes(g.nature?.toLowerCase()))
                                                 .map(g => (
                                                     <option key={g.id} value={g.id}>{g.name}</option>
                                                 ))
                                             }
                                         </optgroup>
                                     )}
                                  </select>
                               </div>

                               {/* NATURE (ONLY FOR GROUPS UNDER PRIMARY/ROOT) */}
                               {formData.type === 'Group' && !formData.parent_id && (
                                   <div>
                                       <label className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b] mb-2 px-1">Group Nature</label>
                                       <select
                                           className="w-full h-14 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl px-6 text-sm font-bold text-[#1e293b] focus:border-[#2563eb] focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                           value={formData.nature || 'Assets'}
                                           onChange={e => setFormData({ ...formData, nature: e.target.value })}
                                       >
                                           <option value="Assets">Assets</option>
                                           <option value="Liabilities">Liabilities</option>
                                           <option value="Income">Income</option>
                                           <option value="Expenses">Expenses</option>
                                       </select>
                                   </div>
                               )}
                            </div>

                        </form>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                            <button 
                                type="button" 
                                onClick={() => setShowDrawer(false)}
                                className="px-5 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSubmit}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors"
                            >
                                {editingId ? 'Update' : 'Save'} {formData.type}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
};

export default LedgersView;
