import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, FileText, ChevronDown, ChevronRight, BarChart2, BookOpen } from 'lucide-react';
import { groupAPI, ledgerAPI } from '../../services/api';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function ChartOfAccountsView() {
  const navigate = useNavigate();
  const companyId = localStorage.getItem('companyId');
  
  const [groups, setGroups] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      groupAPI.getByCompany(companyId),
      ledgerAPI.getByCompany(companyId)
    ]).then(([gRes, lRes]) => {
      setGroups(Array.isArray(gRes.data) ? gRes.data : []);
      setLedgers(Array.isArray(lRes.data) ? lRes.data : []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [companyId]);

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Build the hierarchical tree
  const buildTree = () => {
    // Map groups and ledgers
    const groupNodes = groups.map(g => ({
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

    return (
      <div key={node.id} style={{ marginLeft: depth * 24 }} className="space-y-1">
        <div 
          onClick={() => isGroup ? toggleExpand(node.id) : navigate(`/ledger-statement/${node.id}`)}
          className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border ${isGroup ? 'bg-slate-50/50 border-slate-100 hover:bg-slate-50' : 'bg-white border-transparent hover:border-blue-100 hover:bg-blue-50/20'}`}
        >
          <div className="flex items-center gap-3">
            {isGroup ? (
              <>
                <button className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Folder size={15} />
                </div>
                <div>
                  <span className="text-[13px] font-bold text-slate-800">{node.name}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-3">{node.nature || 'Group'}</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-4" /> {/* Spacer instead of toggle */}
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileText size={15} />
                </div>
                <div>
                  <span className="text-[13px] font-semibold text-slate-700">{node.name}</span>
                  <span className="text-[10px] text-slate-400 font-semibold ml-3">{node.currency}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-6">
            <span className={`text-[13px] font-bold ${isGroup ? 'text-slate-800' : (parseFloat(node.currentBalance || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600')}`}>
              {fmt(Math.abs(node.currentBalance || 0))}
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
      <div className="flex justify-between items-end border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/10">
              <BookOpen size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Masters</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Chart of Accounts</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">Tree structure representing all asset, liability, income, and expense ledger groups</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl space-y-3">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100 pb-4 mb-4 px-3">
            <span>Group / Ledger Name</span>
            <span>Closing Balance</span>
          </div>
          {treeData.map(node => renderNode(node))}
        </div>
      )}
    </div>
  );
}
