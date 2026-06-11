import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronRight, ChevronDown, Plus, 
    RefreshCcw, Search, MoreHorizontal, 
    Wallet, Shield, ArrowUpRight, ArrowDownRight, Activity, BarChart4,
    Folder, FolderOpen, FileText, CornerDownRight, BookOpen, Edit, X, Info
} from 'lucide-react';
import { groupAPI, ledgerAPI } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import useNotificationStore from '../../store/notificationStore';

const LedgersView = ({ showNew }) => {
    const navigate = useNavigate();
    const { addNotification } = useNotificationStore();
    const [groups, setGroups] = useState([]);
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDrawer, setShowDrawer] = useState(showNew || false);
    const [editingId, setEditingId] = useState(null);
    const [seeding, setSeeding] = useState(false);
    const [seedStatus, setSeedStatus] = useState(null); // 'success' | 'error' | null
    
    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteType, setDeleteType] = useState(null);

    // Flattened list for the Parent select dropdown
    const [flatGroupList, setFlatGroupList] = useState([]);
    
    const [formData, setFormData] = useState({ 
        name: '', nature: 'Assets', type: 'Ledger', parent_id: '', description: '', openingBalance: '', openingBalanceType: 'Dr'
    });
    const companyId = sessionStorage.getItem('companyId');
    const user = React.useMemo(() => { try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; } }, []);
    const role = user.role || 'ADMIN';
    const canCreate = !['VIEWER', 'AUDITOR', 'DATA_ENTRY'].includes(role);
    const canDelete = !['VIEWER', 'AUDITOR', 'DATA_ENTRY'].includes(role); 

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
        const currentCompanyId = sessionStorage.getItem('companyId');
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
        const currentId = sessionStorage.getItem('companyId');
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
            if (!sessionStorage.getItem('companyId')) {
                const res = await groupAPI.resolveGroups();
                if (res.data?.companyId) {
                    sessionStorage.setItem('companyId', res.data.companyId);
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

    const handleDeleteLedger = (e, id) => {
        e.stopPropagation();
        setDeleteId(id);
        setDeleteType('ledger');
        setIsDeleteModalOpen(true);
    };

    const handleDeleteGroup = (e, id) => {
        e.stopPropagation();
        setDeleteId(id);
        setDeleteType('group');
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId || !deleteType) return;
        try {
            if (deleteType === 'group') {
                await groupAPI.delete(deleteId);
            } else {
                await ledgerAPI.delete(deleteId);
            }
            fetchData();
        } catch (err) {
            addNotification("Delete failed: " + (err.response?.data?.error || err.message), 'error');
        } finally {
            setIsDeleteModalOpen(false);
            setDeleteId(null);
            setDeleteType(null);
        }
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
                    ? <span key={i} className="bg-yellow-100 text-yellow-900 px-0.5 rounded font-bold">{part}</span> 
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
        const currentCompanyId = sessionStorage.getItem('companyId');
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
        } catch (err) { 
            console.error(err); 
            addNotification(err.response?.data?.error || err.message || "An error occurred while saving.", 'error');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
    };

    const getNodeBalanceSigned = (node, isGroup) => {
        if (!isGroup) {
            // Compute nature-aware closing balance from raw fields
            const rawOpening = Number(node.openingBalance || 0);
            const openingType = (node.openingBalanceType || 'Dr').trim().toUpperCase();
            const nature = (node.Group?.nature || node.nature || 'Assets');
            const isDrNature = ['Assets', 'Expenses'].includes(nature);
            const debit  = Number(node.totalDebit  || 0);
            const credit = Number(node.totalCredit || 0);

            if (isDrNature) {
                const openingDr = openingType === 'DR' ? rawOpening : -rawOpening;
                return openingDr + debit - credit;
            } else {
                const openingCr = openingType === 'CR' ? rawOpening : -rawOpening;
                return openingCr + credit - debit;
            }
        }

        // Group: sum of all child group balances + ledger balances relative to parent nature
        const groupNature = node.nature || 'Assets';
        let total = 0;

        if (node.children) {
            node.children.forEach(child => {
                const childNature = child.nature || groupNature;
                let childBal = getNodeBalanceSigned(child, true);
                if (['Assets', 'Expenses'].includes(childNature) !== ['Assets', 'Expenses'].includes(groupNature)) {
                    childBal = -childBal;
                }
                total += childBal;
            });
        }
        if (node.Ledgers) {
            node.Ledgers.forEach(ledger => {
                const ledgerNature = ledger.Group?.nature || ledger.nature || groupNature;
                let ledgerBal = getNodeBalanceSigned(ledger, false);
                if (['Assets', 'Expenses'].includes(ledgerNature) !== ['Assets', 'Expenses'].includes(groupNature)) {
                    ledgerBal = -ledgerBal;
                }
                total += ledgerBal;
            });
        }
        return total;
    };

    const getNodeBalance = (node, isGroup) => {
        return Math.abs(getNodeBalanceSigned(node, isGroup));
    };


    // Collapse All Handler
    const handleCollapseAll = () => {
        setExpandedGroups(new Set());
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
        const paddingLeft = depth * 28 + 16;
        
        // Nature-specific styling
        const nature = (node.nature || 'Assets').toLowerCase();
        let borderLeftClass = 'border-l-slate-300';
        let bgClass = 'bg-white hover:bg-slate-50/50';
        let iconColor = 'text-slate-500';
        
        if (nature === 'assets') {
            borderLeftClass = 'border-l-emerald-500';
            iconColor = 'text-emerald-500';
            bgClass = isGroup ? 'bg-emerald-50/10 hover:bg-emerald-50/20' : 'bg-white hover:bg-emerald-50/10';
        } else if (nature === 'liabilities') {
            borderLeftClass = 'border-l-rose-500';
            iconColor = 'text-rose-500';
            bgClass = isGroup ? 'bg-rose-50/10 hover:bg-rose-50/20' : 'bg-white hover:bg-rose-50/10';
        } else if (nature === 'income') {
            borderLeftClass = 'border-l-indigo-500';
            iconColor = 'text-indigo-500';
            bgClass = isGroup ? 'bg-indigo-50/10 hover:bg-indigo-50/20' : 'bg-white hover:bg-indigo-50/10';
        } else if (nature === 'expenses') {
            borderLeftClass = 'border-l-amber-500';
            iconColor = 'text-amber-500';
            bgClass = isGroup ? 'bg-amber-50/10 hover:bg-amber-50/20' : 'bg-white hover:bg-amber-50/10';
        }

        return (
            <div key={`${type}-${node.id}`} className="select-none animate-fade-in text-sm border-b border-slate-100/60 last:border-0">
                <div 
                    onClick={(e) => {
                        if (isGroup) {
                            toggleGroup(e, node.id);
                        } else {
                            navigate(`/ledger-statement/${node.id}`);
                        }
                    }}
                    className={`flex items-center group py-3 px-6 transition-all duration-200 cursor-pointer border-l-[6px] ${borderLeftClass} ${bgClass}`}
                >
                    {/* COL 1: NAME & HIERARCHY */}
                    <div className="flex-1 flex items-center gap-3.5 min-w-0" style={{ paddingLeft: `${paddingLeft}px` }}>
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            {isGroup ? (
                                hasChildren ? (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleGroup(e, node.id); }} 
                                        className="w-6 h-6 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-blue-600 transition-all flex items-center justify-center"
                                    >
                                        {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); openDrawerWithParent(node.id); }}
                                        title="Quick Add Ledger"
                                        className="w-6 h-6 rounded-lg hover:bg-blue-100/50 text-slate-300 hover:text-blue-600 transition-all flex items-center justify-center group/plus relative"
                                    >
                                        <ChevronRight size={15} className="group-hover/plus:opacity-0 transition-opacity" />
                                        <Plus size={15} className="absolute opacity-0 group-hover/plus:opacity-100 transition-opacity" />
                                    </button>
                                )
                            ) : (
                                <div className="w-6 h-6 flex items-center justify-center">
                                    <CornerDownRight size={13} className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            )}
                        </div>
                        
                        {isGroup ? (
                            isExpanded ? (
                                <FolderOpen size={16} className={`${iconColor} shrink-0 opacity-80`} />
                            ) : (
                                <Folder size={16} className={`${iconColor} shrink-0 opacity-80`} />
                            )
                        ) : (
                            <FileText size={16} className="text-slate-400 shrink-0 opacity-80" />
                        )}
                        
                        <span className={`truncate w-full pr-4 tracking-tight ${isGroup ? 'font-bold text-slate-800 text-[13px]' : 'font-medium text-slate-600 italic text-[12.5px]'}`}>
                            {highlightText(node.name, searchQuery)}
                        </span>
                    </div>

                    {/* COL 2: TYPE */}
                    <div className="w-40 shrink-0 flex items-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border
                            ${isGroup 
                                ? 'bg-slate-100 text-slate-500 border-slate-200' 
                                : 'bg-transparent text-slate-400 border-transparent group-hover:border-slate-200'}`}>
                            {isGroup ? 'Group' : 'Ledger'}
                        </span>
                    </div>

                    {/* COL 3: NATURE */}
                    <div className="w-40 shrink-0 flex items-center">
                        {(isGroup || node.nature) && (
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border
                                ${nature === 'assets' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  nature === 'liabilities' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                  nature === 'income' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                                  nature === 'expenses' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                {node.nature || 'PRIMARY'}
                            </span>
                        )}
                        {!isGroup && !node.nature && <span className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">—</span>}
                    </div>

                    {/* COL 4: BALANCE + ACTIONS */}
                    <div className="w-56 shrink-0 pr-4 flex items-center justify-end gap-4">
                        <span className={`text-[13px] ${isGroup ? 'font-bold text-slate-900 border-b-2 border-slate-100' : 'font-bold text-slate-700'}`}>
                            {formatCurrency(getNodeBalance(node, isGroup))}
                        </span>
                        
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                            {!isGroup && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/ledger-statement/${node.id}`); }}
                                    title="View Statement"
                                    className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 shadow-sm"
                                >
                                    <BookOpen size={14} />
                                </button>
                            )}
                            
                            {canCreate && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleStartEdit(node, isGroup ? 'Group' : 'Ledger'); }}
                                    title={isGroup ? "Edit Group" : "Edit Ledger"}
                                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm"
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
                                    className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm"
                                >
                                    <Activity size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* RENDER CHILDREN IF EXPANDED */}
                {isGroup && isExpanded && (
                    <div className="flex flex-col border-t border-slate-100/50 bg-slate-50/10">
                        {filteredChildren.map(child => renderNode({ ...child, nature: child.nature || node.nature }, 'group', depth + 1))}
                        {filteredLedgers.map(ledger => renderNode({ ...ledger, nature: ledger.nature || node.nature }, 'ledger', depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] bg-slate-50/50 p-8 font-sans animate-fade-in">
            
            {/* ══ HEADER ══════════════════════════════════════════════ */}
            <div className="flex justify-between items-end border-b border-slate-100 pb-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/10">
                            <BookOpen size={18} />
                        </div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Masters</span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        Ledger Accounts & Groups
                    </h1>
                    <p className="text-slate-400 text-xs mt-1 font-medium">Create and manage your chart of accounts structure, groups, and active ledgers</p>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={fetchData} 
                        className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 group/sync"
                    >
                        <RefreshCcw size={13} className="group-hover/sync:rotate-180 transition-transform duration-500" /> Sync
                    </button>
                    {canCreate && (
                        <button 
                            onClick={() => {
                                setEditingId(null);
                                setFormData({ name: '', nature: 'Assets', type: 'Ledger', parent_id: '', description: '', openingBalance: '', openingBalanceType: 'Dr' });
                                setShowDrawer(true);
                            }}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
                        >
                            <Plus size={15} /> New Account / Group
                        </button>
                    )}
                </div>
            </div>

            {/* ══ STATS SUMMARY ══════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Assets', value: flatGroupList.filter(g => g.nature === 'Assets').length, title: 'Asset Groups', gradient: 'from-emerald-500/10 to-teal-500/5', border: 'hover:border-emerald-300', text: 'text-emerald-600', icon: Wallet },
                    { label: 'Total Liabilities', value: flatGroupList.filter(g => g.nature === 'Liabilities').length, title: 'Liability Groups', gradient: 'from-rose-500/10 to-orange-500/5', border: 'hover:border-rose-300', text: 'text-rose-600', icon: Shield },
                    { label: 'Income & Expense', value: flatGroupList.filter(g => ['Income','Expenses'].includes(g.nature)).length, title: 'Revenue Groups', gradient: 'from-indigo-500/10 to-purple-500/5', border: 'hover:border-indigo-300', text: 'text-indigo-600', icon: Activity },
                    { label: 'Active Ledgers', value: flatGroupList.reduce((acc, g) => acc + (g.Ledgers?.length || 0), 0), title: 'Total Ledgers', gradient: 'from-amber-500/10 to-yellow-500/5', border: 'hover:border-amber-300', text: 'text-amber-600', icon: BookOpen }
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div 
                            key={i} 
                            className={`bg-white p-6 border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group ${stat.border}`}
                        >
                            <div className="space-y-1">
                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                                <div className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat.title}</div>
                            </div>
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} ${stat.text} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                <Icon size={20} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ══ DATA GRID ══════════════════════════════════════════ */}
            <div className="flex-1 bg-white border border-slate-100 rounded-[2rem] shadow-xl flex flex-col overflow-hidden">
                {/* TOOLBAR */}
                <div className="h-16 px-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4 w-96">
                        <div className="relative w-full">
                            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${searchQuery ? 'text-blue-500' : 'text-slate-400'}`} />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter accounts, groups or ledger balances..." 
                                className="w-full pl-9 pr-3 border border-slate-200 bg-white rounded-xl h-10 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 shadow-sm font-medium"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleCollapseAll} 
                            className="h-10 px-4 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
                        >
                            Collapse All
                        </button>
                    </div>
                </div>

                {/* TABLE HEADER */}
                <div className="flex bg-slate-50/30 border-b border-slate-100 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 shrink-0 select-none">
                    <div className="flex-1 pl-[4.5rem]">Account / Group Name</div>
                    <div className="w-40">Record Type</div>
                    <div className="w-40">Nature</div>
                    <div className="w-48 pr-10 text-right">Closing Balance</div>
                </div>
                
                {/* TABLE BODY */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
                            <RefreshCcw size={28} className="animate-spin text-blue-500" />
                            <span className="text-xs font-bold uppercase tracking-widest">Loading Accounts Hierarchy...</span>
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
                            <BarChart4 size={36} className="text-slate-300" />
                            <span className="text-xs font-bold uppercase tracking-widest">No Accounts Configured</span>
                        </div>
                    ) : (
                        // Render roots
                        groups.filter(g => !g.parent_id).map(group => renderNode(group, 'group', 0))
                    )}
                </div>
            </div>

            {/* ══ CREATION / EDITING SLIDE-OUT DRAWER ══════════════════════ */}
            {showDrawer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop blur */}
                    <div 
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300" 
                        onClick={handleCloseDrawer}
                    ></div>
                    
                    {/* Drawer Content */}
                    <div className="relative w-full max-w-[500px] max-h-[90vh] bg-white shadow-2xl border border-slate-200 rounded-[2rem] animate-zoom-in flex flex-col z-10 overflow-hidden font-sans">
                        {/* Header */}
                        <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">{editingId ? 'Edit Account Node' : 'Create Account Node'}</h3>
                                <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest mt-1">{editingId ? 'MODIFY SELECTION' : 'ADD NEW NODE'}</p>
                            </div>
                            <button 
                                onClick={handleCloseDrawer} 
                                className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </header>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">

                            {/* Warning if no company selected */}
                            {!sessionStorage.getItem('companyId') && (
                                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 font-sans">
                                    <Info className="text-rose-500 shrink-0 mt-0.5" size={16} />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-rose-800">No Active Company!</p>
                                        <p className="text-xs text-rose-600 mt-1">Please select or create a company in the Settings first.</p>
                                    </div>
                                </div>
                            )}

                            {/* Seed Warning if empty */}
                            {sessionStorage.getItem('companyId') && flatGroupList.length === 0 && !seeding && !seedStatus && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col gap-4 font-sans">
                                    <div className="flex items-start gap-3">
                                        <Info className="text-amber-500 shrink-0 mt-0.5" size={16} />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-amber-800">Standard Groups Missing!</p>
                                            <p className="text-xs text-amber-600 mt-1">You must initialize standard Tally groups for double-entry transactions.</p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={handleSeedGroups}
                                        className="w-full py-2.5 bg-amber-600 text-white text-xs font-bold uppercase rounded-xl hover:bg-amber-700 shadow-md active:scale-95 transition-all font-sans"
                                    >
                                        Initialize standard Groups
                                    </button>
                                </div>
                            )}

                            {seeding && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 animate-pulse font-sans">
                                    <RefreshCcw size={16} className="animate-spin text-blue-500" />
                                    <p className="text-sm font-bold text-blue-700">Setting up standard groups...</p>
                                </div>
                            )}

                            {seedStatus === 'success' && (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 font-sans">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                        <Activity size={12} className="text-white" />
                                    </div>
                                    <p className="text-sm font-bold text-emerald-700">Groups Initialized Successfully!</p>
                                </div>
                            )}

                            {seedStatus === 'error' && (
                                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col gap-3 font-sans">
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
                                           className="text-[10px] uppercase font-bold tracking-widest bg-rose-600 text-white px-3 py-2 rounded-lg hover:bg-rose-700 transition-all self-start font-sans"
                                        >
                                           Go to Company Setup
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="space-y-6">
                                {/* RECORD TYPE SELECTOR - CARD STYLE */}
                                {!editingId && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Record Type</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div 
                                                onClick={() => setFormData({ ...formData, type: 'Ledger' })}
                                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-center flex flex-col items-center gap-2 font-sans
                                                    ${formData.type === 'Ledger' 
                                                        ? 'border-[#1e61f0] bg-blue-50/20 text-[#1e61f0]' 
                                                        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 text-slate-500'}`}
                                            >
                                                <FileText size={20} className={formData.type === 'Ledger' ? 'text-[#1e61f0]' : 'text-slate-400'} />
                                                <span className="text-[11px] font-extrabold uppercase tracking-wider">Ledger Account</span>
                                            </div>
                                            <div 
                                                onClick={() => setFormData({ ...formData, type: 'Group' })}
                                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-center flex flex-col items-center gap-2 font-sans
                                                    ${formData.type === 'Group' 
                                                        ? 'border-[#1e61f0] bg-blue-50/20 text-[#1e61f0]' 
                                                        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 text-slate-500'}`}
                                            >
                                                <Folder size={20} className={formData.type === 'Group' ? 'text-[#1e61f0]' : 'text-slate-400'} />
                                                <span className="text-[11px] font-extrabold uppercase tracking-wider">Account Group</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* NAME INPUT */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{formData.type === 'Ledger' ? 'Ledger Name' : 'Group Name'}</label>
                                    <input 
                                        type="text"
                                        required
                                        className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                                        placeholder={formData.type === 'Ledger' ? 'e.g. Petty Cash, Office Supplies...' : 'e.g. Administration, Factory Overheads...'}
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                {/* DESCRIPTION BOX */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Description / Notes</label>
                                    <textarea 
                                        className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all min-h-[80px] font-sans"
                                        placeholder="Add notes or details..."
                                        value={formData.description || ''}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                {/* OPENING BALANCE (ONLY FOR LEDGERS) */}
                                {formData.type === 'Ledger' && (
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-3">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Opening Balance</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                                <input 
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full pl-9 pr-4 py-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                                                    placeholder="0.00"
                                                    value={formData.openingBalance || ''}
                                                    onChange={e => setFormData({ ...formData, openingBalance: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-32 space-y-3">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Dr / Cr</label>
                                            <select
                                                className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%231e61f0%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat font-sans"
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
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Under (Select Parent Group)</label>
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
                                        className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%231e61f0%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat font-sans"
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
                                    </select>
                                </div>

                                {/* NATURE (ONLY FOR GROUPS UNDER PRIMARY/ROOT) */}
                                {formData.type === 'Group' && !formData.parent_id && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Group Nature</label>
                                        <select
                                            className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%231e61f0%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat font-sans"
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

                        {/* Footer Actions */}
                        <footer className="p-8 border-t border-slate-100 flex items-center gap-4 bg-slate-50/30 w-full justify-between">
                            <button 
                                type="button" 
                                onClick={handleCloseDrawer}
                                className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[13px] font-bold hover:bg-slate-100 transition-all uppercase tracking-widest font-sans"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSubmit}
                                className="flex-1 py-3 bg-[#1e61f0] hover:bg-[#1a54d1] text-white rounded-xl text-[13px] font-bold shadow-xl shadow-blue-500/10 transition-all uppercase tracking-widest font-sans"
                            >
                                {editingId ? 'Update' : 'Save'} {formData.type}
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteId(null);
                    setDeleteType(null);
                }}
                onConfirm={confirmDelete}
                title={deleteType === 'group' ? "Delete Group" : "Delete Ledger"}
                message={deleteType === 'group' 
                    ? "Are you sure you want to delete this group and its contents? This action cannot be undone."
                    : "Are you sure you want to delete this ledger? This action cannot be undone."}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
            
        </div>
    );
};

export default LedgersView;
