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
  Copy,
  Check
} from 'lucide-react';
import { getGstinStateName } from '../../utils/gstinUtils';

/**
 * Premium Vendor Overview Left Sidebar Card Component
 * Designed to perfectly match the requested design layout, typography, and sections.
 *
 * @param {Object} props
 * @param {Object} props.vendor - Vendor data object
 * @param {Function} [props.onEditAddress] - Callback for editing address
 * @param {Function} [props.onInvitePortal] - Callback for portal invitation
 * @param {Function} [props.onAddContact] - Callback for adding contact persons
 * @param {Function} [props.onSettingsClick] - Callback for settings gear click
 * @param {Function} [props.onEditContact] - Callback for editing contact person
 * @param {Function} [props.onDeleteContact] - Callback for deleting contact person
 */
const VendorOverviewSidebar = ({
  vendor = {},
  onEditAddress,
  onInvitePortal,
  onAddContact,
  onSettingsClick,
  onEditContact,
  onDeleteContact
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyGstin = (e) => {
    e.stopPropagation();
    if (vendor.gstNumber) {
      navigator.clipboard.writeText(vendor.gstNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [openContactDropdown, setOpenContactDropdown] = useState(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.contact-dropdown-container')) {
        setOpenContactDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Collapsible sections state
  const [sections, setSections] = useState({
    address: true,
    otherDetails: true,
    contactPersons: true
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

  const billingAddr = parseAddress(vendor.billingAddress || vendor.billingAddressJson);
  const shippingAddr = parseAddress(vendor.shippingAddress || vendor.shippingAddressJson);

  // Address isEmpty helper
  const isAddressEmpty = (addr) => {
    if (!addr) return true;
    return !addr.address1 && !addr.city && !addr.state && !addr.street1;
  };

  const contactsList = (() => {
    let list = vendor.contacts || [];
    if (list.length === 0 && vendor.contactPersonsJson) {
      try {
        list = JSON.parse(vendor.contactPersonsJson);
      } catch(e) {}
    }
    return list;
  })();

  return (
    <div className="w-full max-w-[420px] bg-white border border-slate-100 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] text-[14px] text-slate-800 font-sans select-none relative">
      
      {/* ─── HEADER SECTION ─── */}
      <div className="m-4 mb-2 p-5 bg-[#f5f7fc]/90 rounded-2xl border border-slate-100/80">
        {/* Vendor Name */}
        <h2 className="text-[16px] font-bold text-slate-900 tracking-tight mb-3">
          {vendor.name || 'XYZ Technologies'}
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
            {/* Email with inline settings gear */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13.5px] font-semibold text-slate-900 truncate hover:text-blue-600 transition-colors">
                {vendor.email || 'xy@gmail.com'}
              </span>
              <button 
                onClick={onSettingsClick}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded-md transition-all shrink-0 border border-transparent hover:border-slate-100"
                title="Settings"
              >
                <Settings size={15} className="stroke-[2.5]" />
              </button>
            </div>

            {/* Primary Phone */}
            {vendor.phone && (
              <div className="flex items-center gap-2 text-[13px] text-slate-800 font-medium">
                <Phone size={13} className="text-slate-500 stroke-[2] shrink-0" />
                <span>{vendor.phone}</span>
              </div>
            )}

            {/* Mobile Phone */}
            {vendor.mobile && (
              <div className="flex items-center gap-2 text-[13px] text-slate-800 font-medium">
                <Smartphone size={13} className="text-slate-500 stroke-[2] shrink-0" />
                <span>{vendor.mobile}</span>
              </div>
            )}

            {/* Fallback if neither exists */}
            {!vendor.phone && !vendor.mobile && (
              <div className="text-[12.5px] text-slate-400 italic mt-1">
                No phone number provided
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
                <p className="text-[13.5px] text-slate-500 leading-relaxed font-medium">
                  No Billing Address -{' '}
                  <button 
                    onClick={() => onEditAddress && onEditAddress('billing')}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Add Address
                  </button>
                </p>
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
            <div className="space-y-1">
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
              {/* Default Currency */}
              <div className="flex justify-between items-center text-[13.5px]">
                <span className="text-slate-500 font-medium">Default Currency</span>
                <span className="text-slate-900 font-semibold">
                  {vendor.currency || 'INR'}
                </span>
              </div>

              {/* Portal Status */}
              <div className="flex justify-between items-center text-[13.5px]">
                <span className="text-slate-500 font-medium">Portal Status</span>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                  <span className="text-red-500 font-semibold">
                    {vendor.portalStatus || 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Vendor Language */}
              <div className="flex justify-between items-center text-[13.5px]">
                <span className="text-slate-500 font-medium">Vendor Language</span>
                <span className="text-slate-900 font-semibold">
                  {vendor.language || 'English'}
                </span>
              </div>

              {/* GSTIN Details */}
              <div className="border-t border-slate-100 pt-3.5 space-y-2.5">
                <div className="flex justify-between items-center text-[13.5px]">
                  <span className="text-slate-500 font-medium">GSTIN</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-bold font-mono">
                      {vendor.gstNumber || 'Unregistered'}
                    </span>
                    {vendor.gstNumber && (
                      <button 
                        onClick={handleCopyGstin}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-all flex items-center justify-center shrink-0 border border-slate-100 shadow-sm bg-white"
                        title="Copy GSTIN"
                      >
                        {copied ? (
                          <Check size={12} className="text-green-500 stroke-[3]" />
                        ) : (
                          <Copy size={12} className="stroke-[2.5]" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {vendor.gstNumber && (
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-slate-500 font-medium">GSTIN State</span>
                    <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {getGstinStateName(vendor.gstNumber) || 'Unknown State'}
                    </span>
                  </div>
                )}
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
          <span className="uppercase">CONTACT PERSONS {contactsList.length > 0 ? `(${contactsList.length})` : ''}</span>
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
            {contactsList.length > 0 ? (
              <div className="space-y-1">
                {contactsList.map((contact, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-transparent border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group rounded-md">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded bg-slate-300 flex items-center justify-center shrink-0 shadow-sm">
                        <User size={22} className="text-white" strokeWidth={3} />
                      </div>
                      <div className="text-[13px]">
                        <p className="font-bold text-slate-900 tracking-tight">{contact.name}</p>
                        {contact.phone && (
                          <div className="flex items-center gap-1.5 text-slate-700 mt-0.5 text-[12px] font-medium">
                            <Phone size={11} className="stroke-[2.5]" />
                            {contact.phone}
                          </div>
                        )}
                        {!contact.phone && contact.mobile && (
                          <div className="flex items-center gap-1.5 text-slate-700 mt-0.5 text-[12px] font-medium">
                            <Smartphone size={11} className="stroke-[2.5]" />
                            {contact.mobile}
                          </div>
                        )}
                        {!contact.phone && !contact.mobile && contact.email && (
                          <div className="flex items-center gap-1.5 text-slate-700 mt-0.5 text-[12px] font-medium">
                            <Mail size={11} className="stroke-[2.5]" />
                            {contact.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="relative contact-dropdown-container">
                      <button 
                        onClick={() => setOpenContactDropdown(openContactDropdown === idx ? null : idx)}
                        className={`p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all ${openContactDropdown === idx ? 'opacity-100 bg-slate-100 text-slate-600' : 'opacity-0 group-hover:opacity-100'}`}
                      >
                        <Settings size={14} className="stroke-[2.5]" />
                      </button>
                      
                      {openContactDropdown === idx && (
                        <div className="absolute right-0 top-full mt-1 w-28 bg-white rounded-lg shadow-lg shadow-slate-200/50 border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                          <button 
                            className="w-full text-left px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            onClick={() => {
                              setOpenContactDropdown(null);
                              if (onEditContact) onEditContact(idx);
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            className="w-full text-left px-3 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                            onClick={() => {
                              setOpenContactDropdown(null);
                              if (onDeleteContact) onDeleteContact(idx);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center bg-slate-50/20 rounded-xl border border-dashed border-slate-100">
                <p className="text-[13.5px] text-slate-500 italic">
                  No contact persons found.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default VendorOverviewSidebar;
