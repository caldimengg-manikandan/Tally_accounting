import React, { useState } from 'react';
import { X, Edit2, FileText, Calendar, Building, CreditCard, Award, User, Phone, Home } from 'lucide-react';

export default function EmployeeDetails({ employee, onClose, onEdit, onDownloadPDF, userRole }) {
  const [activeSubTab, setActiveSubTab] = useState('personal');

  // Helper: Calculate Age from DOB
  const calculateAge = (dobString) => {
    if (!dobString) return '—';
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970) + ' years';
  };

  // Helper: Calculate Years of Service from Date of Joining
  const calculateServiceYears = (joiningDateString) => {
    if (!joiningDateString) return '—';
    const joinDate = new Date(joiningDateString);
    const diffMs = Date.now() - joinDate.getTime();
    const serviceDate = new Date(diffMs);
    const years = Math.abs(serviceDate.getUTCFullYear() - 1970);
    const months = serviceDate.getUTCMonth();
    return `${years} yrs ${months} mos`;
  };

  const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'].includes(userRole);

  const tabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'address', label: 'Address', icon: Home },
    { id: 'employment', label: 'Employment', icon: Calendar },
    { id: 'bank', label: 'Bank Details', icon: CreditCard },
    { id: 'compliance', label: 'Compliance & Tax', icon: FileText },
    { id: 'education', label: 'Edu & Exp', icon: Award }
  ];

  const renderField = (label, value) => (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-1">{value || '—'}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-end animate-fade-in">
      <div className="bg-white w-full max-w-4xl h-full flex flex-col shadow-2xl animate-slide-in">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-200 shadow-inner overflow-hidden">
              {employee.photoUrl ? (
                <img src={employee.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                employee.firstName ? employee.firstName.charAt(0).toUpperCase() : '?'
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{employee.name}</h2>
              <p className="text-xs font-bold text-slate-500 mt-0.5">ID: #{employee.employeeId} <span className="mx-2 text-slate-300">•</span> {employee.designation || 'Staff'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onDownloadPDF(employee.id)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-blue-600 hover:text-blue-600 rounded-xl text-xs font-bold transition-all bg-white shadow-sm"
            >
              <FileText size={15} /> Download PDF
            </button>
            {isPrivileged && !employee.deletedAt && (
              <button
                onClick={() => onEdit(employee)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10"
              >
                <Edit2 size={15} /> Edit Details
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 transition-colors ml-2">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50/20">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all
                ${activeSubTab === tab.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          
          {activeSubTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {renderField('First Name', employee.firstName)}
              {renderField('Middle Name', employee.middleName)}
              {renderField('Last Name', employee.lastName)}
              {renderField('Gender', employee.gender)}
              {renderField('Date of Birth', employee.dob)}
              {renderField('Age', calculateAge(employee.dob))}
              {renderField('Blood Group', employee.bloodGroup)}
              {renderField('Father\'s Name', employee.fatherName)}
              {renderField('Mother\'s Name', employee.motherName)}
              {renderField('Marital Status', employee.maritalStatus)}
            </div>
          )}

          {activeSubTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {renderField('Work Email', employee.email)}
                {renderField('Personal Email', employee.personalEmail)}
                {renderField('Mobile Number', employee.phone)}
              </div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-100">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {renderField('Contact Name', employee.emergencyContactName)}
                {renderField('Relationship', employee.emergencyContactRelation)}
                {renderField('Contact Phone', employee.emergencyContactPhone)}
              </div>
            </div>
          )}

          {activeSubTab === 'address' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Present Address */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Present Address</h4>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                  <p className="text-sm font-semibold text-slate-700">{employee.presentAddressLine1 || '—'}</p>
                  <p className="text-sm font-semibold text-slate-700">{employee.presentAddressLine2 || '—'}</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {[employee.presentAddressCity, employee.presentAddressState].filter(Boolean).join(', ')}
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {[employee.presentAddressCountry, employee.presentAddressZip].filter(Boolean).join(' - ')}
                  </p>
                </div>
              </div>

              {/* Permanent Address */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Permanent Address</h4>
                {employee.sameAsPresentAddress ? (
                  <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 text-blue-700 text-xs font-bold flex items-center h-[162px] justify-center">
                    Same as Present Address
                  </div>
                ) : (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                    <p className="text-sm font-semibold text-slate-700">{employee.permanentAddressLine1 || '—'}</p>
                    <p className="text-sm font-semibold text-slate-700">{employee.permanentAddressLine2 || '—'}</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {[employee.permanentAddressCity, employee.permanentAddressState].filter(Boolean).join(', ')}
                    </p>
                    <p className="text-sm font-semibold text-slate-700">
                      {[employee.permanentAddressCountry, employee.permanentAddressZip].filter(Boolean).join(' - ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'employment' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {renderField('Employee ID', employee.employeeId)}
              {renderField('Date of Joining', employee.dateOfJoining)}
              {renderField('Years of Service', calculateServiceYears(employee.dateOfJoining))}
              {renderField('Department', employee.department)}
              {renderField('Designation', employee.designation)}
              {renderField('Work Location', employee.workLocation)}
              {renderField('Employment Type', employee.employmentType)}
              {renderField('Status', employee.status)}
              {employee.status === 'Resigned' && renderField('Resignation Date', employee.resignationDate)}
            </div>
          )}

          {activeSubTab === 'bank' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {renderField('Bank Name', employee.bankName)}
              {renderField('Account Number', employee.bankAccountNumber)}
              {renderField('Account Type', employee.bankAccountType)}
              {renderField('IFSC Code', employee.ifscCode)}
              {renderField('Branch Name', employee.bankBranchName)}
            </div>
          )}

          {activeSubTab === 'compliance' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {renderField('PAN Number', employee.panNumber)}
              {renderField('Aadhaar Number', employee.aadhaarNumber)}
              {renderField('UAN / PF Number', employee.pfNumber)}
              {renderField('ESI Number', employee.esiNumber)}
              {renderField('PRAN Number', employee.pranNumber)}
            </div>
          )}

          {activeSubTab === 'education' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {renderField('Highest Qualification', employee.highestQualification)}
                {renderField('University / College', employee.universityCollege)}
                {renderField('Year of Passing', employee.yearOfPassing)}
              </div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-100">Work Experience</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {renderField('Previous Company', employee.previousCompany)}
                {renderField('Years of Experience', employee.previousExperience ? `${employee.previousExperience} years` : '—')}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
