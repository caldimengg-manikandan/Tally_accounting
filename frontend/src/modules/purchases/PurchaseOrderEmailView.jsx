import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { purchaseAPI, companyAPI } from '../../services/api';
import PurchaseOrderEmailModal from './PurchaseOrderEmailModal';
import { Loader2 } from 'lucide-react';

const PurchaseOrderEmailView = ({ companyId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [companyDetails, setCompanyDetails] = useState(null);

  useEffect(() => {
    if (!companyId || !id) return;
    
    setLoading(true);
    Promise.all([
      purchaseAPI.getOrders(companyId),
      companyAPI.getById(companyId)
    ])
    .then(([ordersRes, companyRes]) => {
      const foundOrder = (ordersRes.data || []).find(o => String(o.id) === String(id));
      if (!foundOrder) {
        throw new Error('Purchase order not found');
      }
      setOrder(foundOrder);
      setVendor(foundOrder.Ledger || null);
      setCompanyDetails(companyRes.data);
      setLoading(false);
    })
    .catch(err => {
      console.error('Failed to load PO data:', err);
      setError('Could not load Purchase Order details.');
      setLoading(false);
    });
  }, [companyId, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50 p-8">
        <div className="text-center">
          <p className="text-red-500 font-medium mb-4">{error || 'Purchase Order not found.'}</p>
          <button 
            onClick={() => navigate('/purchase-orders')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Purchase Orders
          </button>
        </div>
      </div>
    );
  }

  // Parse email contacts if saved
  let savedContactIds = [];
  try {
    if (order.emailContactsJson) {
      savedContactIds = JSON.parse(order.emailContactsJson);
    }
  } catch(e) {}

  // Reconstruct full contact objects from vendor
  const contacts = [];
  if (vendor) {
    const cleanNameStr = (str) => {
      if (!str) return '';
      return str.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.|Mr|Ms|Mrs)\s+/i, '').trim();
    };

    if (vendor.email) {
      const name = cleanNameStr([vendor.firstName, vendor.lastName].filter(Boolean).join(' ') || vendor.name || 'Primary');
      contacts.push({ id: 'primary', name, email: vendor.email });
    }
    
    try {
       const others = vendor.contactPersonsJson ? JSON.parse(vendor.contactPersonsJson) : [];
       if (Array.isArray(others)) {
          others.forEach((c, idx) => {
             if (c.email) {
                let name = c.name || [c.firstName, c.lastName].filter(Boolean).join(' ') || c.salutation || `Contact ${idx+1}`;
                name = cleanNameStr(name);
                contacts.push({ id: `contact-${idx}`, name, email: c.email });
             }
          });
       }
    } catch(e) {}
  }

  const finalSelectedContacts = contacts.filter(c => savedContactIds.includes(c.id));

  return (
    <div className="h-full w-full bg-white relative">
      <PurchaseOrderEmailModal 
        isOpen={true}
        onClose={() => navigate(-1)}
        vendor={vendor}
        poData={{
          ...order, 
          id: order.id, 
          poNumber: order.orderNumber, 
          companyId: companyId
        }}
        totals={{ total: parseFloat(order.totalAmount || 0) }}
        attachments={[]} 
        selectedContacts={finalSelectedContacts}
        companyName={companyDetails?.name || ''}
        onSent={() => {
          purchaseAPI.updateOrder(order.id, { status: 'issued', billed_status: 'yet_to_be_billed' })
            .catch(e => console.error('Failed to update status', e));
          navigate(`/purchase-orders/view/${order.id}`, { state: { successMessage: 'Your purchase order has been sent.' } });
        }}
        isFullScreenView={true}
      />
    </div>
  );
};

export default PurchaseOrderEmailView;
