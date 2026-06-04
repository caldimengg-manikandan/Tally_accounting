import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, FolderOpen, FileText, ChevronDown, ChevronRight, BarChart2, BookOpen, RefreshCw } from 'lucide-react';
import { groupAPI, ledgerAPI, companyAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const getNodeBalanceSigned = (node, parentNature = 'Assets') => {
  if (!node) return 0;
  if (node.type === 'ledger') {
    const rawOpening = Number(node.openingBalance || 0);
    const openingType = (node.openingBalanceType || 'Dr').trim().toUpperCase();
    const nature = node.nature || node.Group?.nature || parentNature;
    const isDrNature = ['Assets', 'Expenses'].includes(nature);
    const debit = Number(node.totalDebit || 0);
    const credit = Number(node.totalCredit || 0);

    if (isDrNature) {
      const openingDr = openingType === 'DR' ? rawOpening : -rawOpening;
      return openingDr + debit - credit;
    } else {
      const openingCr = openingType === 'CR' ? rawOpening : -rawOpening;
      return openingCr + credit - debit;
    }
  }

  // Group: sum of all child group/ledger balances relative to parent/group nature
  const groupNature = node.nature || parentNature;
  let total = 0;
  if (node.children) {
    node.children.forEach(child => {
      const childNature = child.nature || groupNature;
      let childBal = getNodeBalanceSigned(child, groupNature);
      if (['Assets', 'Expenses'].includes(childNature) !== ['Assets', 'Expenses'].includes(groupNature)) {
        childBal = -childBal;
      }
      total += childBal;
    });
  }
  return total;
};

const getNodeBalance = (node) => {
  return Math.abs(getNodeBalanceSigned(node));
};

export default function ChartOfAccountsView() {
  const navigate = useNavigate();
  const companyId = localStorage.getItem('companyId');
  
  const [groups, setGroups] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotificationStore();

  const handleSync = async () => {
    if (!companyId || companyId === 'null' || companyId === 'undefined') return;
    try {
      setLoading(true);
      await companyAPI.syncDefaultLedgers(companyId);
      addNotification('Chart of Accounts synced successfully!', 'success');
      fetchContext();
    } catch (err) {
      console.error(err);
      addNotification('Failed to sync Chart of Accounts.', 'error');
      setLoading(false);
    }
  };

  const fetchContext = () => {
    if (!companyId || companyId === 'null' || companyId === 'undefined') {
      setLoading(false);
      return;
    }
    setLoading(true);
    groupAPI.getByCompany(companyId)
      .then(gRes => {
        const fetchedGroups = Array.isArray(gRes.data) ? gRes.data : [];
        if (fetchedGroups.length === 0) {
          console.log(`No groups found for company ${companyId}. Auto-seeding default Tally groups...`);
          return groupAPI.seedStandard(companyId)
            .then(() => {
              return groupAPI.getByCompany(companyId);
            });
        }
        return gRes;
      })
      .then(gRes => {
        setGroups(Array.isArray(gRes.data) ? gRes.data : []);
        return ledgerAPI.getByCompany(companyId);
      })
      .then(lRes => {
        setLedgers(Array.isArray(lRes.data) ? lRes.data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading Chart of Accounts:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchContext();
  }, [companyId]);

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Build the hierarchical tree
  const buildTree = () => {
    // Map groups and ledgers
    const groupNodes = groups
      .filter(g => g.name.toLowerCase() !== 'suspense account')
      .map(g => ({
        ...g,
        type: 'group',
        children: []
      }));

    const ledgerNodes = ledgers.map(l => ({
      ...l,
      type: 'ledger',
    }));

    const rootNodes = [];
    const groupMap = {};

    groupNodes.forEach(g => {
      groupMap[g.id] = g;
    });

    // 1. Nest sub-groups
    groupNodes.forEach(g => {
      if (g.parent_id && groupMap[g.parent_id]) {
        groupMap[g.parent_id].children.push(g);
      } else {
        rootNodes.push(g);
      }
    });

    // 2. Nest ledgers into their respective groups
    ledgerNodes.forEach(l => {
      if (l.GroupId && groupMap[l.GroupId]) {
        groupMap[l.GroupId].children.push(l);
      }
    });

    return rootNodes;
  };

  const renderNode = (node, depth = 0) => {
    const isGroup = node.type === 'group';
    const hasChildren = isGroup && node.children.length > 0;
    const isExpanded = !!expanded[node.id];
    const balance = getNodeBalance(node);
    
    // Nature-specific styling
    const nature = (node.nature || 'Assets').toLowerCase();
    let borderLeftClass = 'border-l-slate-300';
    let bgClass = 'bg-white hover:bg-slate-50/50';
    let iconColor = 'text-slate-500';
    
    if (nature === 'assets') {
        borderLeftClass = 'border-l-blue-600';
        iconColor = 'text-blue-600';
        bgClass = isGroup ? 'bg-blue-50/5 hover:bg-blue-50/10' : 'bg-white hover:bg-blue-50/5';
    } else if (nature === 'liabilities') {
        borderLeftClass = 'border-l-indigo-600';
        iconColor = 'text-indigo-600';
        bgClass = isGroup ? 'bg-indigo-50/5 hover:bg-indigo-50/10' : 'bg-white hover:bg-indigo-50/5';
    } else if (nature === 'income') {
        borderLeftClass = 'border-l-sky-600';
        iconColor = 'text-sky-600';
        bgClass = isGroup ? 'bg-sky-50/5 hover:bg-sky-50/10' : 'bg-white hover:bg-sky-50/5';
    } else if (nature === 'expenses') {
        borderLeftClass = 'border-l-slate-500';
        iconColor = 'text-slate-500';
        bgClass = isGroup ? 'bg-slate-50 hover:bg-slate-100/50' : 'bg-white hover:bg-slate-50';
    }

    return (
      <div key={node.id} className="space-y-1.5 w-full">
        <div 
          onClick={() => isGroup ? toggleExpand(node.id) : navigate(`/ledger-statement/${node.id}`)}
          style={{ paddingLeft: `${depth * 28 + 16}px` }}
          className={`flex items-center justify-between py-3.5 px-6 rounded-r-2xl transition-all duration-200 cursor-pointer border-y border-r border-slate-100/50 border-l-[6px] ${borderLeftClass} ${bgClass}`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {isGroup ? (
              <>
                <button className="p-1 rounded-lg text-slate-400 hover:bg-slate-200/60 transition-all flex items-center justify-center shrink-0">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <div className={`w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0`}>
                  {isExpanded ? (
                    <FolderOpen size={16} className={`${iconColor}`} />
                  ) : (
                    <Folder size={16} className={`${iconColor}`} />
                  )}
                </div>
                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-bold text-slate-800 truncate block">{node.name}</span>
                  {node.name === 'Capital Account' && balance === 0 && (
                    <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-medium shrink-0 animate-pulse">
                      No opening balance set. Go to Ledgers → Capital Account → add opening balance to fix Trial Balance imbalance.
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-6" /> {/* Spacer */}
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-slate-400" />
                </div>
                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                  <span className="text-[12.5px] font-semibold text-slate-600 italic truncate block">{node.name}</span>
                  {node.name === 'Capital Account' && balance === 0 && (
                    <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-medium shrink-0">
                      No opening balance set. Go to Ledgers → Capital Account → add opening balance to fix Trial Balance imbalance.
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <span className={`text-[13.5px] font-black ${isGroup ? 'text-slate-800' : (balance >= 0 ? 'text-emerald-600' : 'text-rose-600')}`}>
              {balance < 0 ? `-${fmt(Math.abs(balance))}` : fmt(balance)}
            </span>
          </div>
        </div>

        {isGroup && isExpanded && node.children.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  const treeData = buildTree();

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/10">
              <BookOpen size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Masters</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Chart of Accounts</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">Tree structure representing all asset, liability, income, and expense ledger groups</p>
        </div>
        <div>
          <button 
              onClick={handleSync} 
              className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 group/sync"
          >
              <RefreshCw size={13} className="group-hover/sync:rotate-180 transition-transform duration-500" /> Sync
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl space-y-4">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100 pb-4 mb-4 px-6 select-none">
            <span>Group / Ledger Name</span>
            <span>Closing Balance</span>
          </div>
          <div className="space-y-2">
            {treeData.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-wider">No Accounts Configured</div>
            ) : (
              treeData.map(node => renderNode(node))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
