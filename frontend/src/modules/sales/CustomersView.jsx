import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ledgerAPI } from '../../services/api';
import CustomerForm from './CustomerForm';
import { Loader2 } from 'lucide-react';

const CustomersView = ({ companyId }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
       setFetching(true);
       ledgerAPI.getByCompany(companyId).then(res => {
          const c = res.data.find(l => String(l.id) === String(id));
          if (c) setCustomerToEdit(c);
       }).finally(() => setFetching(false));
    }
  }, [id, isEditMode, companyId]);

  if (fetching) {
     return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
     );
  }

  return (
    <CustomerForm 
        standalone={true}
        customerToEdit={customerToEdit}
        companyId={companyId}
        onSaveSuccess={(newCustomer) => {
            const savedId = newCustomer?.ledger?.id || newCustomer?.id;
            if (savedId) {
              navigate(`/customers/view/${savedId}`);
            } else {
              navigate('/customers');
            }
        }}
        onCancel={() => window.history.length > 2 ? navigate(-1) : navigate('/customers')}
    />
  );
};

export default CustomersView;
