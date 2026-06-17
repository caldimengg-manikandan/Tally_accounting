import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, Eye, Edit2, ShieldAlert, ShieldCheck, Download, Upload, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function EmployeeList({ 
  employees, 
  total,
  page,
  limit,
  pages,
  onPageChange,
  onLimitChange,
  onSearchChange,
  onFilterChange,
  onViewEmployee,
  onEditEmployee,
  onArchiveEmployee,
  onReactivateEmployee,
  onOpenImport,
  onOpenAdd,
  onExportCSV
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('DESC');

  // Fetch departments from employees dynamically for filter options
  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  useEffect(() => {
    onFilterChange({
      status: statusFilter,
      department: deptFilter,
      employmentType: typeFilter,
      includeArchived: includeArchived ? 'true' : 'false',
      sortBy,
      sortDir
    });
  }, [statusFilter, deptFilter, typeFilter, includeArchived, sortBy, sortDir]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearchChange(searchTerm);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortDir('ASC');
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
          />
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <button type="submit" className="hidden">Search</button>
        </form>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button
            onClick={onExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all"
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            onClick={onOpenImport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all"
          >
            <Upload size={15} /> Bulk Import
          </button>
          <button
            onClick={onOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/10 transition-all"
          >
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* Filter and Settings Panel */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
          <Filter size={15} /> Filters:
        </div>
        
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 bg-white outline-none focus:border-blue-400"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Resigned">Resigned</option>
        </select>

        {/* Department Filter */}
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 bg-white outline-none focus:border-blue-400"
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Employment Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 bg-white outline-none focus:border-blue-400"
        >
          <option value="">All Job Types</option>
          <option value="Full Time">Full Time</option>
          <option value="Part Time">Part Time</option>
          <option value="Contract">Contract</option>
          <option value="Intern">Intern</option>
        </select>

        {/* Include Archived Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 ml-auto">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
          />
          Show Archived (Deleted)
        </label>
      </div>

      {/* Employees Table Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('employeeId')}>
                <div className="flex items-center gap-1.5">Emp ID <ArrowUpDown size={13} /></div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('firstName')}>
                <div className="flex items-center gap-1.5">Name <ArrowUpDown size={13} /></div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('department')}>
                <div className="flex items-center gap-1.5">Dept / Desg <ArrowUpDown size={13} /></div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('dateOfJoining')}>
                <div className="flex items-center gap-1.5">Joining Date <ArrowUpDown size={13} /></div>
              </th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-24 text-center">
                  <p className="text-slate-400 font-bold mb-2">No employees match the criteria.</p>
                  <p className="text-slate-400 text-xs font-medium">Try resetting your filters or search query.</p>
                </td>
              </tr>
            ) : employees.map(emp => (
              <tr key={emp.id} className={`hover:bg-slate-50/50 transition-colors ${emp.deletedAt ? 'opacity-60 bg-red-50/10' : ''}`}>
                <td className="px-6 py-4 font-bold text-blue-600">#{emp.employeeId}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100 shrink-0">
                      {emp.photoUrl ? (
                        <img src={emp.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        emp.name ? emp.name.charAt(0).toUpperCase() : '?'
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{emp.name}</p>
                      <p className="text-xs text-slate-500 font-normal">{emp.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  <p className="font-bold text-slate-800">{emp.department || '—'}</p>
                  <p className="text-xs text-slate-500 font-normal">{emp.designation || 'Staff'}</p>
                </td>
                <td className="px-6 py-4 text-slate-500 font-semibold text-xs">
                  {emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString('en-GB') : '—'}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border 
                    ${emp.deletedAt 
                      ? 'bg-rose-50 text-rose-700 border-rose-200' 
                      : emp.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : emp.status === 'Inactive' 
                          ? 'bg-slate-50 text-slate-600 border-slate-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {emp.deletedAt ? 'Archived' : emp.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onViewEmployee(emp)}
                      title="View Profile"
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Eye size={16} />
                    </button>
                    {!emp.deletedAt && (
                      <button
                        onClick={() => onEditEmployee(emp)}
                        title="Edit Details"
                        className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    {emp.deletedAt ? (
                      <button
                        onClick={() => onReactivateEmployee(emp.id)}
                        title="Reactivate Employee"
                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                      >
                        <ShieldCheck size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to archive ${emp.firstName}? They will be marked as Inactive.`)) {
                            onArchiveEmployee(emp.id);
                          }
                        }}
                        title="Archive Employee"
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <ShieldAlert size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex justify-between items-center text-xs font-bold text-slate-500">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-400">Total: {total} Employees</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              Page {page} of {pages || 1}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === pages || pages === 0}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
