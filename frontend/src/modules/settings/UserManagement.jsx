import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Edit2, ShieldAlert, Loader2, Save, X } from 'lucide-react';
import { usersAPI, rolesAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';
import RoleBuilderModal from './RoleBuilderModal';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Company Administrator' },
  { value: 'ACCOUNTANT', label: 'Professional Accountant' },
  { value: 'AUDITOR', label: 'Financial Auditor' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'EMPLOYEE', label: 'Standard Employee' },
  { value: 'VIEWER', label: 'Read-Only Viewer' }
];

const UserManagement = ({ companyId }) => {
  const { addNotification } = useNotificationStore();
  const [users, setUsers] = useState([]);
  const [customRoles, setCustomRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // User object being edited
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Invite Form
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'ACCOUNTANT', customRoleId: '' });
  // Edit Role Form
  const [editRoleValue, setEditRoleValue] = useState('ACCOUNTANT');
  const [editCustomRoleId, setEditCustomRoleId] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [companyId]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [resUsers, resRoles] = await Promise.all([
        usersAPI.getCompanyUsers(),
        rolesAPI.getRoles()
      ]);
      setUsers(resUsers.data.users || []);
      setCustomRoles(resRoles.data || []);
    } catch (err) {
      console.error(err);
      addNotification('Failed to fetch workspace data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getCombinedRoleOptions = () => {
    const activeCustom = customRoles.filter(r => r.isActive).map(r => ({
      value: `custom_${r.id}`,
      label: r.name,
      isCustom: true,
      baseRole: r.baseRole
    }));
    return [...ROLE_OPTIONS, ...activeCustom, { value: 'NEW_ROLE', label: '+ Add New Custom Role' }];
  };

  const handleInviteChange = (key, val) => {
    if (key === 'role' && val === 'NEW_ROLE') {
      setIsRoleModalOpen(true);
      return;
    }
    if (key === 'role' && val.startsWith('custom_')) {
      const customId = val.split('_')[1];
      const selected = customRoles.find(r => r.id === parseInt(customId) || r.id === customId);
      setInviteForm(prev => ({ ...prev, role: selected.baseRole, customRoleId: customId }));
      return;
    }
    if (key === 'role') {
      setInviteForm(prev => ({ ...prev, role: val, customRoleId: null }));
      return;
    }
    setInviteForm(prev => ({ ...prev, [key]: val }));
  };

  const submitInvite = async () => {
    if (!inviteForm.email.trim() || !inviteForm.name.trim()) {
      addNotification('Email and Name are strictly required to send an invitation', 'warning');
      return;
    }
    setInviting(true);
    try {
      await usersAPI.inviteUser(inviteForm);
      addNotification(`Invitation sent to ${inviteForm.email} successfully!`, 'success');
      setInviteForm({ email: '', name: '', role: 'ACCOUNTANT', customRoleId: '' });
      fetchUsers();
    } catch (err) {
      console.error(err);
      addNotification(err.response?.data?.error || 'Failed to send invitation', 'error');
    } finally {
      setInviting(false);
    }
  };

  const saveRoleUpdate = async () => {
    if (!editingUser) return;
    try {
      let roleData = { role: editRoleValue };
      if (editRoleValue.startsWith('custom_')) {
        const customId = editRoleValue.split('_')[1];
        const selected = customRoles.find(r => r.id === parseInt(customId) || r.id === customId);
        roleData = { role: selected.baseRole, customRoleId: customId };
      }

      await usersAPI.updateUserRole(editingUser.id, roleData);
      addNotification('User role updated successfully', 'success');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      addNotification(err.response?.data?.error || 'Failed to update user role', 'error');
    }
  };

  const removeUser = (user) => {
    setUserToDelete(user);
  };

  const confirmRemoveUser = async () => {
    if (!userToDelete) return;
    try {
      await usersAPI.removeUser(userToDelete.id);
      addNotification('User removed from company successfully', 'success');
      fetchUsers();
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404 || err.response?.data?.error === 'User not found') {
        addNotification('User is already removed', 'success');
        fetchUsers();
      } else {
        addNotification(err.response?.data?.error || 'Failed to remove user', 'error');
      }
    } finally {
      setUserToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
        <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
        <span className="text-xs font-bold uppercase tracking-widest">Loading Users & Roles...</span>
      </div>
    );
  }

  return (
    <div className="w-full box-border">
      <header className="mb-8 border-b border-slate-100 dark:border-slate-700 pb-5">
        <div className="flex items-center gap-2.5">
          <Users className="text-blue-600" size={24} />
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Users & Roles</h1>
        </div>
        <p className="text-[12px] text-slate-400 mt-1">
          Manage employee and auditor memberships, invite new colleagues, assign role-based access permissions, and revoke workspace access.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Users list table */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-100">
            Workspace Members
          </h2>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="p-4">Name & Email</th>
                    <th className="p-4">Role Permission</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {users.map(user => (
                    <tr key={user.id} className="text-slate-700 hover:bg-slate-50/30">
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{user.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                      </td>
                      <td className="p-4">
                        {editingUser?.id === user.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={editRoleValue}
                              onChange={e => setEditRoleValue(e.target.value)}
                              className="h-8 border border-slate-200 rounded px-2 text-[12px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 bg-white dark:bg-slate-700"
                            >
                              {getCombinedRoleOptions().filter(opt => opt.value !== 'NEW_ROLE').map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <button 
                              onClick={saveRoleUpdate}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                            >
                              <Save size={14} />
                            </button>
                            <button 
                              onClick={() => setEditingUser(null)}
                              className="p-1.5 bg-slate-100 text-slate-500 dark:text-slate-400 rounded hover:bg-slate-200"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider
                            ${user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
                              ? 'bg-rose-100 text-rose-800'
                              : user.role === 'AUDITOR'
                                ? 'bg-amber-100 text-amber-800'
                                : user.role === 'ACCOUNTANT'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-800 dark:text-slate-100'}`}>
                            {user.customRoleId 
                              ? (customRoles.find(r => r.id === parseInt(user.customRoleId))?.name || user.role)
                              : user.role}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {editingUser?.id !== user.id && (
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setEditRoleValue(user.role);
                            }}
                            className="p-2 border border-slate-200 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 inline-flex"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => removeUser(user)}
                          className="p-2 border border-rose-200 rounded-lg text-rose-500 hover:bg-rose-50 inline-flex"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Invite User Side Panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-1.5">
              <UserPlus size={16} className="text-blue-500" /> Invite User
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={e => handleInviteChange('name', e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email Address *</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={e => handleInviteChange('email', e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Workspace Role</label>
                <select
                  value={inviteForm.customRoleId ? `custom_${inviteForm.customRoleId}` : inviteForm.role}
                  onChange={e => handleInviteChange('role', e.target.value)}
                  className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 bg-white dark:bg-slate-700"
                >
                  {getCombinedRoleOptions().map(opt => <option key={opt.value} value={opt.value} className={opt.value === 'NEW_ROLE' ? 'font-bold text-blue-600' : ''}>{opt.label}</option>)}
                </select>
              </div>

              <button
                onClick={submitInvite}
                disabled={inviting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                {inviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Send Invite
              </button>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert size={16} className="text-amber-500" /> Permission Scope
            </h3>
            <ul className="space-y-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed list-disc pl-4">
              <li><strong>Administrators</strong> have unrestricted control over billing, settings, and users.</li>
              <li><strong>Accountants</strong> can post transactions, record manual journals, and view Daybooks.</li>
              <li><strong>Auditors</strong> have view-only access to reports, ledger logs, and audit logs.</li>
            </ul>
          </div>
        </div>
      </div>
      
      <RoleBuilderModal 
        isOpen={isRoleModalOpen} 
        onClose={() => setIsRoleModalOpen(false)} 
        onSaved={fetchUsers} 
      />

      {userToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Remove User</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Are you absolutely sure you want to remove <span className="font-bold text-slate-700 dark:text-slate-200">"{userToDelete.name}"</span> from this company? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRemoveUser}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
              >
                Remove User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
