import React from 'react';
import { X, Mail, Phone, User, Calendar, Briefcase, Building, CreditCard, FileText, Home, Award } from 'lucide-react';

export default function EmployeeDetailsDrawer({ isOpen, onClose, employeeData }) {
  if (!isOpen || !employeeData) return null;

  const initials = employeeData.firstName ? employeeData.firstName.charAt(0).toUpperCase() : 'E';

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Slide-out Drawer Panel */}
      <div className="fixed right-0 top-0 h-full w-[500px] bg-white shadow-2xl z-50 transition-all overflow-y-auto flex flex-col">
        {/* HEADER Section */}
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-start justify-between sticky top-0 z-10">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold shadow-sm">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                {employeeData.firstName} {employeeData.lastName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md text-[10px] font-bold tracking-wider uppercase">
                  {employeeData.employeeId || 'N/A'}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {employeeData.designation || 'N/A'} • {employeeData.department || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors bg-white shadow-sm border border-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8 flex-1 bg-slate-50/30">
          
          {/* 1. Personal Details */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <User size={14} /> 1. Personal Details
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Full Name</span>
                <span className="text-sm font-semibold text-slate-700">{employeeData.firstName} {employeeData.middleName} {employeeData.lastName}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Gender</span>
                <span className="text-sm font-semibold text-slate-700">{employeeData.gender || '-'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Date of Birth</span>
                <span className="text-sm font-semibold text-slate-700">{employeeData.dob || '-'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Blood Group</span>
                <span className="text-sm font-semibold text-slate-700">{employeeData.bloodGroup || '-'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Marital Status</span>
                <span className="text-sm font-semibold text-slate-700">{employeeData.maritalStatus || '-'}</span>
              </div>
              
              {(employeeData.fatherName || employeeData.motherName) && (
                <div className="col-span-2 pt-2 border-t border-slate-50 mt-1 grid grid-cols-2 gap-4">
                  {employeeData.fatherName && (
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Father's Name</span>
                      <span className="text-sm font-semibold text-slate-700">{employeeData.fatherName}</span>
                    </div>
                  )}
                  {employeeData.motherName && (
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Mother's Name</span>
                      <span className="text-sm font-semibold text-slate-700">{employeeData.motherName}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* 2. Contact */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Phone size={14} /> 2. Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Work Email</span>
                <span className="text-sm font-semibold text-slate-700 break-all">{employeeData.workEmail || employeeData.email || '-'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Personal Email</span>
                <span className="text-sm font-semibold text-slate-700 break-all">{employeeData.personalEmail || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Mobile Number</span>
                <span className="text-sm font-semibold text-slate-700">{employeeData.mobileNumber || employeeData.phone || '-'}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-50 mt-1">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1 flex items-center gap-1 text-rose-500">Emergency Contact</span>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-semibold text-slate-700">
                    {employeeData.emergencyContactName || '-'} 
                    <span className="text-slate-500 font-normal ml-1">
                      {(employeeData.emergencyContactRelationship || employeeData.emergencyContactRelation) ? `(Relation: ${employeeData.emergencyContactRelationship || employeeData.emergencyContactRelation})` : '(Relation: Not Specified)'}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    <span className="text-xs font-normal text-slate-500 mr-2 uppercase tracking-widest">Mobile No:</span>
                    {employeeData.emergencyContactPhone || '-'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Address */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Home size={14} /> 3. Address Details
            </h3>
            <div className="space-y-4">
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Present Address</span>
                <span className="text-sm font-semibold text-slate-700 block">{employeeData.presentAddressLine1 || '-'}</span>
                {employeeData.presentAddressLine2 && <span className="text-sm font-semibold text-slate-700 block">{employeeData.presentAddressLine2}</span>}
                <span className="text-sm font-semibold text-slate-700 block mt-1">
                  {employeeData.presentAddressCity}, {employeeData.presentAddressState} {employeeData.presentAddressZip}
                </span>
                <span className="text-sm font-semibold text-slate-500 block">{employeeData.presentAddressCountry}</span>
              </div>
              
              {!employeeData.sameAsPresentAddress && (
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Permanent Address</span>
                  <span className="text-sm font-semibold text-slate-700 block">{employeeData.permanentAddressLine1 || '-'}</span>
                  {employeeData.permanentAddressLine2 && <span className="text-sm font-semibold text-slate-700 block">{employeeData.permanentAddressLine2}</span>}
                  <span className="text-sm font-semibold text-slate-700 block mt-1">
                    {employeeData.permanentAddressCity}, {employeeData.permanentAddressState} {employeeData.permanentAddressZip}
                  </span>
                  <span className="text-sm font-semibold text-slate-500 block">{employeeData.permanentAddressCountry}</span>
                </div>
              )}
            </div>
          </section>

          {/* 4. Job Detail */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Briefcase size={14} /> 4. Job Details
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Employee ID</span>
                <span className="text-sm font-semibold text-slate-700">{employeeData.employeeId || '-'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Date of Joining</span>
                <span className="text-sm font-semibold text-slate-700">{employeeData.dateOfJoining || '-'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Employment Type</span>
                <span className="text-sm font-semibold text-slate-700">{employeeData.employmentType || '-'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Status</span>
                <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider text-[10px]">{employeeData.status || 'Active'}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-50 mt-1 grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Department</span>
                  <span className="text-sm font-semibold text-slate-700">{employeeData.department || '-'}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Designation</span>
                  <span className="text-sm font-semibold text-slate-700">{employeeData.designation || '-'}</span>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Bank Details */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <CreditCard size={14} /> 5. Bank Details
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="col-span-2">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Bank Name</span>
                <span className="text-sm font-semibold text-slate-700">{employeeData.bankName || '-'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Account Number</span>
                <span className="text-sm font-bold text-slate-700 font-mono tracking-wider">{employeeData.bankAccountNumber || '-'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">IFSC Code</span>
                <span className="text-sm font-bold text-slate-700 font-mono tracking-wider">{employeeData.ifscCode || '-'}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-50 mt-1">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Branch Name</span>
                <span className="text-sm font-semibold text-slate-700">{employeeData.bankBranchName || employeeData.bankBranch || '-'}</span>
              </div>
            </div>
          </section>

          {/* 6. Compliance */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <FileText size={14} /> 6. Tax & Compliance
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">PAN Number</span>
                <span className="text-sm font-semibold text-slate-700 font-mono tracking-wider">{employeeData.panNumber || '-'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Aadhaar Number</span>
                <span className="text-sm font-semibold text-slate-700 font-mono tracking-wider">{employeeData.aadhaarNumber || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">UAN / PF Number</span>
                <span className="text-sm font-semibold text-slate-700 font-mono tracking-wider">{employeeData.uanNumber || employeeData.pfNumber || '-'}</span>
              </div>
            </div>
          </section>

          {/* 7. Education & Experience */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Award size={14} /> 7. Education & Experience
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="col-span-2">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Degree / Qualification</span>
                <span className="text-sm font-semibold text-slate-700">{employeeData.highestQualification || employeeData.degree || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Institution / University</span>
                <span className="text-sm font-semibold text-slate-700">{employeeData.universityCollege || employeeData.institution || '-'}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-50 mt-1">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Year of Passing</span>
                <span className="text-sm font-semibold text-slate-700">{employeeData.yearOfPassing || '-'}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-50 mt-1">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1 flex items-center gap-1 text-slate-500">Previous Experience</span>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-semibold text-slate-700">{employeeData.previousCompany || 'No Previous Company'}</span>
                  <span className="text-sm font-bold text-slate-700">{employeeData.previousExperience ? `${employeeData.previousExperience} Years` : '-'}</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
