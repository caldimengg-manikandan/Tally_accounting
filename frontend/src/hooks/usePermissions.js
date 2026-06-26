import { useAuth } from '../store/AuthContext';
import { getUser } from '../stores/authStore';

export const usePermissions = () => {
  // Try Context first, fallback to store if used outside context tree
  let user = null;
  try {
    const contextAuth = useAuth();
    if (contextAuth && contextAuth.user) {
      user = contextAuth.user;
    }
  } catch (e) {
    // useAuth might throw if called completely outside AuthProvider, though rare.
  }
  
  if (!user) {
    user = getUser();
  }

  // Ensure role is a string
  const role = (user?.Role?.name || user?.role || 'VIEWER').toUpperCase();
  
  // Matrix logic:
  // SUPER_ADMIN, ADMIN, ACCOUNTANT: Full access
  // EMPLOYEE, DATA_ENTRY: Can create and edit (their own unapproved), but not delete or approve
  // MANAGER: Read-only forms, but can approve transactions
  // AUDITOR, VIEWER: Strictly read-only
  
  const canCreateRoles = ['SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'ACCOUNTANT', 'EMPLOYEE', 'DATA_ENTRY'];
  const canEditRoles = ['SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'ACCOUNTANT', 'EMPLOYEE', 'DATA_ENTRY'];
  const canDeleteRoles = ['SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'ACCOUNTANT'];
  const canApproveRoles = ['SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'ACCOUNTANT', 'MANAGER'];

  const permissions = {
    role,
    canCreate: canCreateRoles.includes(role),
    canEdit: canEditRoles.includes(role),
    canDelete: canDeleteRoles.includes(role),
    canApprove: canApproveRoles.includes(role),
    isReadOnly: !canEditRoles.includes(role), // Helper for disabling form fields
  };

  return permissions;
};

export default usePermissions;
