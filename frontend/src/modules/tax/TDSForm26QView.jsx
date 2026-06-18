import React, { useState, useEffect } from 'react';
import { taxAPI } from '../../services/api';
import { FileText, Download, Building2, User, HelpCircle, Loader2, Calendar } from 'lucide-react';
import useNotificationStore from '../../store/notificationStore';

const TDSForm26QView = ({ companyId }) => {
    const { addNotification } = useNotificationStore();
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);

    useEffect(() => {
        if (!companyId) return;
        setLoading(true);
        taxAPI.getTDSForm26Q(companyId)
            .then(res => setReport(res.data))
            .catch(err => {
                console.error(err);
                addNotification('Failed to load Form 26Q report', 'error');
            })
            .finally(() => setLoading(false));
    }, [companyId]);

    const formatCurrency = (val) => `₹${parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc]">
                <Loader2 size={40} className="animate-spin text-blue-500 mb-4 opacity-50" />
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Generating Form 26Q...</p>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc]">
                <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">No data available</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] animate-fade-in">
            {/* Header */}
            <div className="bg-white px-8 py-6 flex items-center justify-between border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Form 26Q (TDS Report)
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase tracking-[0.2em] border border-blue-200">
                            Compliance
                        </span>
                    </h1>
                    <p className="text-[12px] font-medium text-slate-500 uppercase tracking-widest mt-1">
                        Quarterly statement of deduction of tax under sub-section (3) of section 200 of the Income-tax Act
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-[13px] rounded-lg hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 uppercase tracking-widest">
                        <Download size={16} /> Export FVU
                    </button>
                    <button className="px-5 py-2.5 bg-[#1e61f0] text-white font-bold text-[13px] rounded-lg hover:bg-blue-700 transition-all shadow-md flex items-center gap-2 uppercase tracking-widest">
                        <FileText size={16} /> Print Report
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-[1200px] mx-auto space-y-8">
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Total Gross Paid</p>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                                {formatCurrency(report.totalGrossAmount)}
                            </h2>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                                <Building2 size={64} />
                            </div>
                            <p className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-2 relative z-10">Total TDS Deducted</p>
                            <h2 className="text-3xl font-black text-blue-700 tracking-tight relative z-10">
                                {formatCurrency(report.totalTdsAmount)}
                            </h2>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Generated On</p>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight mt-1">
                                {new Date(report.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </h2>
                        </div>
                    </div>

                    {/* Section Summary */}
                    {Object.keys(report.summaryBySection).length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-widest">Summary by Section</h3>
                            </div>
                            <div className="p-6">
                                <div className="flex gap-4">
                                    {Object.entries(report.summaryBySection).map(([section, data]) => (
                                        <div key={section} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-black text-[12px] tracking-widest">
                                                    {section}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gross Paid</p>
                                                    <p className="text-[13px] font-bold text-slate-700">{formatCurrency(data.gross)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">TDS Amount</p>
                                                    <p className="text-[15px] font-black text-blue-600">{formatCurrency(data.tds)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Entries Table */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-widest">Deductee Details (Annexure)</h3>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-2 py-1 rounded">
                                {report.entries.length} Entries Found
                            </div>
                        </div>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                                    <th className="px-6 py-4">Vendor Name</th>
                                    <th className="px-6 py-4">PAN</th>
                                    <th className="px-6 py-4 text-center">Section</th>
                                    <th className="px-6 py-4 text-center">Quarter</th>
                                    <th className="px-6 py-4 text-right">Gross Amount</th>
                                    <th className="px-6 py-4 text-right">TDS Rate</th>
                                    <th className="px-6 py-4 text-right">TDS Deducted</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {report.entries.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[12px]">
                                            No TDS entries found for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    report.entries.map((entry, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                                                    <User size={14} className="text-slate-300" />
                                                    {entry.vendorName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[12px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block tracking-widest">
                                                    {entry.pan || 'UNREGISTERED'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 tracking-widest">
                                                    {entry.tdsSection}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                                    {entry.quarter}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-[13px] font-bold text-slate-700">
                                                {formatCurrency(entry.grossAmount)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-[13px] font-bold text-slate-500">
                                                {entry.tdsRate}%
                                            </td>
                                            <td className="px-6 py-4 text-right text-[14px] font-black text-blue-700">
                                                {formatCurrency(entry.tdsAmount)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TDSForm26QView;
