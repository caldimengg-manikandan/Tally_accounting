import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Settings, 
  Edit2, 
  Plus, 
  User, 
  Mail, 
  Phone, 
  Smartphone,
  Laptop
} from 'lucide-react';

/**
 * Premium Customer Overview Left Sidebar Card Component
 * Matches the requested Customer module visual layout, typography, dark text, and sections.
 */
const CustomerOverviewSidebar = ({
  customer = {},
  onEditAddress,
  onInvitePortal,
  onAddContact,
  onSettingsClick,
  onEnablePortal
}) => {
  // Collapsible sections state
  const [sections, setSections] = useState({
    address: true,
    otherDetails: true,
    contactPersons: true,
    recordInfo: false
  });

  const toggleSection = (sectionName) => {
    setSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // Helper to parse addresses safely
  const parseAddress = (addr) => {
    if (!addr) return null;
    if (typeof addr === 'object') return addr;
    try {
      return JSON.parse(addr);
    } catch (e) {
      return null;
    }
  };

  const billingAddr = parseAddress(customer.billingAddress || customer.billingAddressJson);
  const shippingAddr = parseAddress(customer.shippingAddress || customer.shippingAddressJson);

  // Address isEmpty helper
  const isAddressEmpty = (addr) => {
    if (!addr) return true;
    return !addr.address1 && !addr.city && !addr.state && !addr.street1;
  };

  // Safe formatting of full name
  const getFullName = () => {
    const parts = [customer.salutation, customer.firstName, customer.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Ms. Divya';
  };

  return (
    <div className="w-full max-w-[420px] bg-white border border-slate-100 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] text-[14px] text-slate-800 overflow-hidden font-sans select-none">
      
      {/* ─── HEADER SECTION ─── */}
      <div className="m-4 mb-2 p-5 bg-[#f5f7fc]/90 rounded-2xl border border-slate-100/80">
        {/* Customer Name */}
        <h2 className="text-[16px] font-bold text-slate-900 tracking-tight mb-3">
          {customer.name || 'Stripe Enterprises'}
        </h2>
        
        {/* Horizontal Divider Line */}
        <div className="h-px bg-slate-200/70 w-full mb-4"></div>

        {/* Profile Details Container */}
        <div className="flex gap-4">
          {/* Profile Avatar Placeholder */}
          <div className="w-14 h-14 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-sm">
            <User size={30} className="text-slate-400 stroke-[1.5]" />
          </div>

          {/* Contact Details stack */}
          <div className="flex-1 space-y-1.5 pt-0.5 min-w-0">
            {/* Contact Name & Settings Gear */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13.5px] font-semibold text-slate-900 truncate">
                {getFullName()}
              </span>
              <button 
                onClick={onSettingsClick}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded-md transition-all shrink-0 border border-transparent hover:border-slate-100"
                title="Settings"
              >
                <Settings size={15} className="stroke-[2.5]" />
              </button>
            </div>

            {/* Email Address */}
            {customer.email && (
              <div className="flex items-center gap-2 text-[13px] text-slate-800 font-medium">
                <Mail size={13} className="text-slate-500 stroke-[2] shrink-0" />
                <span className="truncate hover:text-blue-600 cursor-pointer transition-colors">
                  {customer.email}
                </span>
              </div>
            )}

            {/* Primary Phone */}
            {(customer.workPhone || customer.phone) && (
              <div className="flex items-center gap-2 text-[13px] text-slate-800 font-medium">
                <Phone size={13} className="text-slate-500 stroke-[2] shrink-0" />
                <span>{customer.workPhone || customer.phone}</span>
              </div>
            )}

            {/* Mobile Phone */}
            {customer.mobile && (
              <div className="flex items-center gap-2 text-[13px] text-slate-800 font-medium">
                <Smartphone size={13} className="text-slate-500 stroke-[2] shrink-0" />
                <span>{customer.mobile}</span>
              </div>
            )}

            {/* Invite to Portal Link */}
            <div className="pt-2">
              <button 
                onClick={onInvitePortal}
                className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all"
              >
                Invite to Portal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ADDRESS SECTION ─── */}
      <div className="border-t border-slate-100/60">
        {/* Section Header */}
        <button 
          onClick={() => toggleSection('address')}
          className="w-full px-5 py-4 flex items-center justify-between text-[12px] font-bold text-slate-800 tracking-[0.05em] hover:bg-slate-50/40 transition-colors uppercase"
        >
          <span>ADDRESS</span>
          {sections.address ? (
            <ChevronUp size={14} className="text-blue-600 stroke-[2.5]" />
          ) : (
            <ChevronDown size={14} className="text-blue-600 stroke-[2.5]" />
          )}
        </button>

        {/* Section Content */}
        {sections.address && (
          <div className="px-5 pb-5 space-y-5 animate-fade-in">
            {/* Billing Address container */}
            <div className="space-y-2 relative group pr-6">
              <h4 className="text-[13.5px] font-semibold text-slate-900">
                Billing Address
              </h4>
              {!isAddressEmpty(billingAddr) ? (
                <div className="text-[13.5px] text-slate-800 leading-relaxed font-medium">
                  {billingAddr.attention && <p className="font-semibold text-slate-900">{billingAddr.attention}</p>}
                  {billingAddr.street1 && <p>{billingAddr.street1}</p>}
                  {billingAddr.street2 && <p>{billingAddr.street2}</p>}
                  {billingAddr.address1 && <p>{billingAddr.address1}</p>}
                  {billingAddr.address2 && <p>{billingAddr.address2}</p>}
                  <p>
                    {[billingAddr.city, billingAddr.state, billingAddr.country].filter(Boolean).join(', ')}
                  </p>
                  {(billingAddr.phone || billingAddr.zip || billingAddr.pinCode) && (
                    <p className="mt-1 text-slate-600 text-[12px] font-medium">
                      {billingAddr.phone && `Phone: ${billingAddr.phone}`}
                      {billingAddr.zip && ` (Zip: ${billingAddr.zip})`}
                      {billingAddr.pinCode && ` (Pin: ${billingAddr.pinCode})`}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-[13.5px] text-slate-800 leading-relaxed font-medium">
                  Bengaluru<br />
                  Tamil Nadu India
                </div>
              )}

              {/* Inline edit pencil icon */}
              <button 
                onClick={() => onEditAddress && onEditAddress('billing')}
                className="absolute right-0 top-0.5 p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-all"
                title="Edit Address"
              >
                <Edit2 size={13} className="stroke-[2.5]" />
              </button>
            </div>

            {/* Shipping Address container */}
            <div className="space-y-1 relative group pr-6">
              <h4 className="text-[13.5px] font-semibold text-slate-900">
                Shipping Address
              </h4>
              {!isAddressEmpty(shippingAddr) ? (
                <div className="text-[13.5px] text-slate-800 leading-relaxed font-medium">
                  {shippingAddr.attention && <p className="font-semibold text-slate-900">{shippingAddr.attention}</p>}
                  {shippingAddr.street1 && <p>{shippingAddr.street1}</p>}
                  {shippingAddr.street2 && <p>{shippingAddr.street2}</p>}
                  {shippingAddr.address1 && <p>{shippingAddr.address1}</p>}
                  {shippingAddr.address2 && <p>{shippingAddr.address2}</p>}
                  <p>
                    {[shippingAddr.city, shippingAddr.state, shippingAddr.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              ) : (
                <p className="text-[13.5px] text-slate-500 leading-relaxed font-medium">
                  No Shipping Address -{' '}
                  <button 
                    onClick={() => onEditAddress && onEditAddress('shipping')}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    New Address
                  </button>
                </p>
              )}

              {/* Inline edit pencil icon */}
              <button 
                onClick={() => onEditAddress && onEditAddress('shipping')}
                className="absolute right-0 top-0.5 p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-all"
                title="Edit Address"
              >
                <Edit2 size={13} className="stroke-[2.5]" />
              </button>
            </div>

            {/* Add Additional Address link */}
            <div className="pt-1">
              <button 
                onClick={() => onEditAddress && onEditAddress('additional')}
                className="text-[13.5px] font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all"
              >
                Add additional address
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── OTHER DETAILS SECTION ─── */}
      <div className="border-t border-slate-100/60">
        {/* Section Header */}
        <button 
          onClick={() => toggleSection('otherDetails')}
          className="w-full px-5 py-4 flex items-center justify-between text-[12px] font-bold text-slate-800 tracking-[0.05em] hover:bg-slate-50/40 transition-colors uppercase"
        >
          <span>OTHER DETAILS</span>
          {sections.otherDetails ? (
            <ChevronUp size={14} className="text-blue-600 stroke-[2.5]" />
          ) : (
            <ChevronDown size={14} className="text-blue-600 stroke-[2.5]" />
          )}
        </button>

        {/* Section Content */}
        {sections.otherDetails && (
          <div className="px-5 pb-5 space-y-4 animate-fade-in">
            {/* Key-Value alignment grid */}
            <div className="space-y-3.5">
              {/* Customer Type */}
              <div className="flex justify-between items-center text-[13.5px]">
                <span className="text-slate-500 font-medium">Customer Type</span>
                <span className="text-slate-900 font-semibold">
                  {customer.customerType || 'Business'}
                </span>
              </div>

              {/* Default Currency */}
              <div className="flex justify-between items-center text-[13.5px]">
                <span className="text-slate-500 font-medium">Default Currency</span>
                <span className="text-slate-900 font-semibold">
                  {customer.currency || 'INR'}
                </span>
              </div>

              {/* Portal Status */}
              <div className="flex justify-between items-center text-[13.5px]">
                <span className="text-slate-500 font-medium">Portal Status</span>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                  <span className="text-red-500 font-semibold">
                    {customer.portalStatus || 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Customer Language */}
              <div className="flex justify-between items-center text-[13.5px]">
                <span className="text-slate-500 font-medium">Customer Language</span>
                <span className="text-slate-900 font-semibold">
                  {customer.language || 'English'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── CONTACT PERSONS SECTION ─── */}
      <div className="border-t border-slate-100/60">
        {/* Section Header */}
        <div 
          onClick={() => toggleSection('contactPersons')}
          className="w-full px-5 py-4 flex items-center justify-between text-[12px] font-bold text-slate-800 tracking-[0.05em] hover:bg-slate-50/40 transition-colors cursor-pointer select-none"
        >
          <span className="uppercase">CONTACT PERSONS</span>
          <div className="flex items-center gap-3.5" onClick={e => e.stopPropagation()}>
            <button 
              onClick={onAddContact}
              className="p-0.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-all shrink-0"
              title="Add Contact Person"
            >
              <Plus size={15} className="stroke-[3]" />
            </button>
            <button onClick={() => toggleSection('contactPersons')}>
              {sections.contactPersons ? (
                <ChevronUp size={14} className="text-blue-600 stroke-[2.5]" />
              ) : (
                <ChevronDown size={14} className="text-blue-600 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>

        {/* Section Content */}
        {sections.contactPersons && (
          <div className="px-5 pb-6 animate-fade-in">
            {customer.contacts && customer.contacts.length > 0 ? (
              <div className="space-y-3">
                {customer.contacts.map((contact, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2 bg-slate-50/50 border border-slate-100 rounded-lg">
                    <User size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <div className="text-[13px]">
                      <p className="font-semibold text-slate-800">{contact.name}</p>
                      {contact.email && <p className="text-slate-500">{contact.email}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="py-6 text-center bg-slate-50/20 rounded-xl border border-dashed border-slate-100">
                  <p className="text-[13.5px] text-slate-500 italic">
                    No contact persons found.
                  </p>
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── RECORD INFO SECTION ─── */}
      <div className="border-t border-slate-100/60">
        <button 
          onClick={() => toggleSection('recordInfo')}
          className="w-full px-5 py-4 flex items-center justify-between text-[12px] font-bold text-slate-800 tracking-[0.05em] hover:bg-slate-50/40 transition-colors uppercase"
        >
          <span>RECORD INFO</span>
          {sections.recordInfo ? (
            <ChevronUp size={14} className="text-blue-600 stroke-[2.5]" />
          ) : (
            <ChevronDown size={14} className="text-blue-600 stroke-[2.5]" />
          )}
        </button>

        {sections.recordInfo && (
          <div className="px-5 pb-5 space-y-3.5 animate-fade-in text-[13.5px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Customer ID</span>
              <span className="text-slate-900 font-semibold">{customer.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Created On</span>
              <span className="text-slate-900 font-semibold">
                {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-GB') : '---'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Created By</span>
              <span className="text-slate-900 font-semibold">{customer.createdBy || 'Administrator'}</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default CustomerOverviewSidebar;
