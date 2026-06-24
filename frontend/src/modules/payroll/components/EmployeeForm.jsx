import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Save, User, Phone, Home, Calendar, CreditCard, FileText, Award, Upload, AlertCircle, Loader2, X } from 'lucide-react';
import { payrollAPI } from '../../../services/api';
import CreatableSelect from '../../../components/CreatableSelect';

const indiaStates = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Lakshadweep", 
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", 
  "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", 
  "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const commonCountries = [
  "India", "United States", "United Kingdom", "Canada", "Australia", "Singapore", "United Arab Emirates", 
  "Germany", "France", "Japan", "New Zealand", "South Africa"
];

export default function EmployeeForm({ employee, onClose, onSave, companyId }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [highestStep, setHighestStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '', middleName: '', lastName: '', dob: '', bloodGroup: '', fatherName: '', motherName: '', maritalStatus: 'Single',
    email: '', personalEmail: '', phone: '', emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
    presentAddressLine1: '', presentAddressLine2: '', presentAddressCity: '', presentAddressState: '', presentAddressCountry: 'India', presentAddressZip: '',
    sameAsPresentAddress: false,
    permanentAddressLine1: '', permanentAddressLine2: '', permanentAddressCity: '', permanentAddressState: '', permanentAddressCountry: 'India', permanentAddressZip: '',
    employeeId: '', dateOfJoining: new Date().toISOString().split('T')[0], employmentType: 'Full Time', department: '', designation: '', workLocation: '', status: 'Active', resignationDate: '',
    bankName: '', bankAccountNumber: '', bankAccountType: 'Savings', bankBranchName: '', ifscCode: '',
    panNumber: '', aadhaarNumber: '', pfNumber: '', esiNumber: '', pranNumber: '',
    highestQualification: '', universityCollege: '', yearOfPassing: '', previousCompany: '', previousExperience: '',
    photoUrl: '', isDraft: false
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [checkingUniqueness, setCheckingUniqueness] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [newDepartment, setNewDepartment] = useState('');
  const [showAddDesignation, setShowAddDesignation] = useState(false);
  const [newDesignation, setNewDesignation] = useState('');

  // Load departments and designations from localStorage
  useEffect(() => {
    const savedDepts = localStorage.getItem(`empDepts_${companyId}`);
    if (savedDepts) setDepartments(JSON.parse(savedDepts));
    else setDepartments(['Engineering', 'Sales', 'Human Resources', 'Marketing', 'Finance', 'Operations', 'IT Support']);

    const savedDesigs = localStorage.getItem(`empDesigs_${companyId}`);
    if (savedDesigs) setDesignations(JSON.parse(savedDesigs));
    else setDesignations(['Software Engineer', 'Senior Software Engineer', 'HR Manager', 'Sales Manager', 'Accountant', 'Product Manager']);
  }, [companyId]);

  const saveDepartment = () => {
    if (newDepartment.trim()) {
      const updated = [...new Set([...departments, newDepartment.trim()])];
      setDepartments(updated);
      localStorage.setItem(`empDepts_${companyId}`, JSON.stringify(updated));
      setFormData(prev => ({ ...prev, department: newDepartment.trim() }));
      if (validationErrors.department) setValidationErrors(prev => ({ ...prev, department: '' }));
    }
    setShowAddDepartment(false);
    setNewDepartment('');
  };

  const saveDesignation = () => {
    if (newDesignation.trim()) {
      const updated = [...new Set([...designations, newDesignation.trim()])];
      setDesignations(updated);
      localStorage.setItem(`empDesigs_${companyId}`, JSON.stringify(updated));
      setFormData(prev => ({ ...prev, designation: newDesignation.trim() }));
      if (validationErrors.designation) setValidationErrors(prev => ({ ...prev, designation: '' }));
    }
    setShowAddDesignation(false);
    setNewDesignation('');
  };

  useEffect(() => {
    if (employee) {
      setFormData({
        ...employee,
        middleName: employee.middleName || '',
        lastName: employee.lastName || '',
        dob: employee.dob || '',
        bloodGroup: employee.bloodGroup || '',
        fatherName: employee.fatherName || '',
        motherName: employee.motherName || '',
        maritalStatus: employee.maritalStatus || 'Single',
        personalEmail: employee.personalEmail || '',
        emergencyContactName: employee.emergencyContactName || '',
        emergencyContactPhone: employee.emergencyContactPhone || '',
        emergencyContactRelation: employee.emergencyContactRelation || '',
        presentAddressLine1: employee.presentAddressLine1 || '',
        presentAddressLine2: employee.presentAddressLine2 || '',
        presentAddressCity: employee.presentAddressCity || '',
        presentAddressState: employee.presentAddressState || '',
        presentAddressCountry: employee.presentAddressCountry || 'India',
        presentAddressZip: employee.presentAddressZip || '',
        sameAsPresentAddress: employee.sameAsPresentAddress || false,
        permanentAddressLine1: employee.permanentAddressLine1 || '',
        permanentAddressLine2: employee.permanentAddressLine2 || '',
        permanentAddressCity: employee.permanentAddressCity || '',
        permanentAddressState: employee.permanentAddressState || '',
        permanentAddressCountry: employee.permanentAddressCountry || 'India',
        permanentAddressZip: employee.permanentAddressZip || '',
        employmentType: employee.employmentType || 'Full Time',
        resignationDate: employee.resignationDate || '',
        bankName: employee.bankName || '',
        bankAccountNumber: employee.bankAccountNumber || '',
        bankAccountType: employee.bankAccountType || 'Savings',
        bankBranchName: employee.bankBranchName || '',
        ifscCode: employee.ifscCode || '',
        aadhaarNumber: employee.aadhaarNumber || '',
        pfNumber: employee.pfNumber || '',
        esiNumber: employee.esiNumber || '',
        pranNumber: employee.pranNumber || '',
        highestQualification: employee.highestQualification || '',
        universityCollege: employee.universityCollege || '',
        yearOfPassing: employee.yearOfPassing || '',
        previousCompany: employee.previousCompany || '',
        previousExperience: employee.previousExperience || '',
        photoUrl: employee.photoUrl || ''
      });
      if (employee.photoUrl) {
        setPhotoPreview(employee.photoUrl);
      }
    }
  }, [employee]);

  // Load Draft from LocalStorage on mount (only for new employees)
  useEffect(() => {
    if (!employee) {
      try {
        const savedDraft = localStorage.getItem(`empDraft_${companyId}`);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.formData) setFormData(parsed.formData);
          if (parsed.currentStep) {
            setCurrentStep(parsed.currentStep);
            setHighestStep(parsed.currentStep);
          }
        }
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, [employee, companyId]);

  // Save Draft to LocalStorage on changes (only for new employees)
  useEffect(() => {
    if (!employee) {
      localStorage.setItem(`empDraft_${companyId}`, JSON.stringify({ formData, currentStep }));
    }
  }, [formData, currentStep, employee, companyId]);

  useEffect(() => {
    if (currentStep > highestStep) {
      setHighestStep(currentStep);
    }
  }, [currentStep, highestStep]);

  // Handle Text/Input Changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    
    // Auto-formatting values
    if (name === 'panNumber' || name === 'ifscCode') {
      val = val.toUpperCase();
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));

    // Clear error
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Photo Upload Handler
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        alert('Please select a JPG or PNG image.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Validate on Blur for uniqueness
  const validateFieldUniqueness = async (field, value) => {
    if (!value) return;
    setCheckingUniqueness(prev => ({ ...prev, [field]: true }));
    try {
      let isAvailable = true;
      const excludeId = employee?.id || null;

      if (field === 'email') {
        const res = await payrollAPI.validateEmail({ email: value, excludeId });
        isAvailable = res.data.available;
      } else if (field === 'panNumber') {
        const res = await payrollAPI.validatePan({ panNumber: value, excludeId });
        isAvailable = res.data.available;
      } else if (field === 'aadhaarNumber') {
        const res = await payrollAPI.validateAadhaar({ aadhaarNumber: value, excludeId });
        isAvailable = res.data.available;
      }

      if (!isAvailable) {
        setValidationErrors(prev => ({
          ...prev,
          [field]: `${field === 'email' ? 'Email' : field === 'panNumber' ? 'PAN' : 'Aadhaar'} is already taken.`
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingUniqueness(prev => ({ ...prev, [field]: false }));
    }
  };

  // Step validation
  const validateStep = () => {
    const errs = {};
    const today = new Date().toISOString().split('T')[0];

    if (currentStep === 1) {
      if (!formData.firstName) errs.firstName = 'First Name is required.';
      if (!formData.dob) {
        errs.dob = 'Date of Birth is required.';
      } else {
        if (formData.dob > today) errs.dob = 'DOB cannot be a future date.';
        const age = Math.abs(new Date(Date.now() - new Date(formData.dob).getTime()).getUTCFullYear() - 1970);
        if (age < 18) errs.dob = 'Employee must be at least 18 years old.';
      }
      if (!formData.gender) errs.gender = 'Gender is required.';
    }

    if (currentStep === 2) {
      if (!formData.email) {
        errs.email = 'Work Email is required.';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errs.email = 'Invalid email format.';
      }
      if (!formData.phone) {
        errs.phone = 'Mobile Number is required.';
      } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
        errs.phone = 'Mobile must be a valid 10-digit number starting with 6-9.';
      }
    }

    if (currentStep === 3) {
      if (!formData.presentAddressLine1) errs.presentAddressLine1 = 'Address Line 1 is required.';
      if (!formData.presentAddressCity) errs.presentAddressCity = 'City is required.';
      if (!formData.presentAddressState) errs.presentAddressState = 'State is required.';
      if (!formData.presentAddressZip) {
        errs.presentAddressZip = 'Zip code is required.';
      } else if (!/^\d{6}$/.test(formData.presentAddressZip)) {
        errs.presentAddressZip = 'Zip code must be exactly 6 digits.';
      }

      if (!formData.sameAsPresentAddress) {
        if (!formData.permanentAddressLine1) errs.permanentAddressLine1 = 'Permanent Address Line 1 is required.';
        if (!formData.permanentAddressCity) errs.permanentAddressCity = 'City is required.';
        if (!formData.permanentAddressState) errs.permanentAddressState = 'State is required.';
        if (!formData.permanentAddressZip) {
          errs.permanentAddressZip = 'Zip code is required.';
        } else if (!/^\d{6}$/.test(formData.permanentAddressZip)) {
          errs.permanentAddressZip = 'Zip code must be exactly 6 digits.';
        }
      }
    }

    if (currentStep === 4) {
      if (!formData.dateOfJoining) {
        errs.dateOfJoining = 'Date of Joining is required.';
      } else if (formData.dateOfJoining > today) {
        errs.dateOfJoining = 'Joining Date cannot be in the future.';
      }
      if (!formData.department) errs.department = 'Department is required.';
      if (!formData.designation) errs.designation = 'Designation is required.';
    }

    if (currentStep === 5) {
      if (formData.bankAccountNumber && !/^\d+$/.test(formData.bankAccountNumber)) {
        errs.bankAccountNumber = 'Account Number must contain digits only.';
      }
      if (formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) {
        errs.ifscCode = 'IFSC Code must be valid (e.g. SBIN0001234).';
      }
    }

    if (currentStep === 6) {
      if (formData.panNumber && !/^[A-Z]{5}\d{4}[A-Z]$/.test(formData.panNumber)) {
        errs.panNumber = 'Invalid PAN format (e.g. ABCDE1234F).';
      }
      if (formData.aadhaarNumber && !/^\d{12}$/.test(formData.aadhaarNumber)) {
        errs.aadhaarNumber = 'Aadhaar must be exactly 12 digits.';
      }
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Submit flow
  const handleSave = async (isDraft = false) => {
    if (!isDraft && !validateStep()) {
      setError('Please fix the validation errors before saving.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        ...formData,
        workEmail: formData.email,
        dob: formData.dob || null,
        resignationDate: formData.resignationDate || null,
        dateOfJoining: formData.dateOfJoining || null,
        isDraft,
        companyId
      };

      let savedEmployee;
      if (employee?.id) {
        const res = await payrollAPI.updateEmployee(employee.id, payload);
        savedEmployee = res.data;
      } else {
        const res = await payrollAPI.createEmployee(payload);
        savedEmployee = res.data;
      }

      // If photo was updated, upload it now
      if (photoFile && savedEmployee?.id) {
        const fd = new FormData();
        fd.append('photo', photoFile);
        await payrollAPI.uploadPhoto(savedEmployee.id, fd);
      }

      if (!employee) {
        localStorage.removeItem(`empDraft_${companyId}`);
      }

      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save employee profile.');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { label: 'Personal', icon: User },
    { label: 'Contact', icon: Phone },
    { label: 'Address', icon: Home },
    { label: 'Job Detail', icon: Calendar },
    { label: 'Bank Details', icon: CreditCard },
    { label: 'Compliance', icon: FileText },
    { label: 'Education', icon: Award },
    { label: 'Review', icon: Upload }
  ];

  return (
    <div className="flex flex-col w-full min-h-[80vh] animate-fade-in pb-20">
      
      {/* Header and Draft option */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-150 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {employee ? `Edit ${formData.firstName || 'Employee'}'s Profile` : 'Add New Employee'}
          </h2>
          <p className="text-slate-400 text-xs font-medium mt-1">Completing step {currentStep} of 8</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 transition-all bg-white"
          >
            <Save size={15} /> Save as Draft
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 bg-white"
          >
            Cancel
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl mb-6 flex items-center gap-2.5 max-w-5xl mx-auto w-full text-sm font-bold">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Progress Stepper */}
      <div className="max-w-5xl mx-auto w-full mb-10">
        <div className="flex items-center justify-between">
          {steps.map((st, idx) => {
            const stepNum = idx + 1;
            const Icon = st.icon;
            return (
              <React.Fragment key={idx}>
                <div 
                  className={`flex flex-col items-center gap-2 relative ${stepNum <= highestStep ? 'cursor-pointer hover:opacity-80' : 'opacity-50 cursor-not-allowed'}`}
                  onClick={() => {
                    if (stepNum === currentStep) return;
                    if (stepNum < currentStep) {
                      setCurrentStep(stepNum);
                    } else if (stepNum <= highestStep) {
                      if (validateStep()) {
                        setCurrentStep(stepNum);
                      }
                    }
                  }}
                >
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-sm border transition-all duration-300
                    ${currentStep === stepNum 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10' 
                      : stepNum <= highestStep && currentStep !== stepNum
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                        : 'bg-white text-slate-400 border-slate-200'}`}>
                    <Icon size={16} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${currentStep === stepNum ? 'text-blue-600' : 'text-slate-400'}`}>
                    {st.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${currentStep > stepNum ? 'bg-emerald-200' : 'bg-slate-100'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form Steps container */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm max-w-5xl mx-auto w-full flex-1">
        
        {/* Step 1: Personal Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white transition-all
                    ${validationErrors.firstName ? 'border-rose-400 ring-2 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
                />
                {validationErrors.firstName && <p className="text-rose-500 text-xs font-semibold mt-1.5">{validationErrors.firstName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white transition-all
                    ${validationErrors.gender ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'}`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {validationErrors.gender && <p className="text-rose-500 text-xs font-semibold mt-1.5">{validationErrors.gender}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Date of Birth *</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white transition-all
                    ${validationErrors.dob ? 'border-rose-400 ring-2 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
                />
                {validationErrors.dob && <p className="text-rose-500 text-xs font-semibold mt-1.5">{validationErrors.dob}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Blood Group</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                >
                  <option value="">Select Blood Group</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Father's Name</label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Mother's Name</label>
                <input
                  type="text"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Marital Status</label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Contact Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Work Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={(e) => validateFieldUniqueness('email', e.target.value)}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white transition-all
                    ${validationErrors.email ? 'border-rose-400 ring-2 ring-rose-50' : 'border-slate-200 focus:border-blue-500'}`}
                />
                {checkingUniqueness.email && <p className="text-xs text-slate-400 mt-1">Verifying...</p>}
                {validationErrors.email && <p className="text-rose-500 text-xs font-semibold mt-1.5">{validationErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Personal Email</label>
                <input
                  type="email"
                  name="personalEmail"
                  value={formData.personalEmail}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Mobile Number *</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white transition-all
                    ${validationErrors.phone ? 'border-rose-400 ring-2 ring-rose-50' : 'border-slate-200 focus:border-blue-500'}`}
                />
                {validationErrors.phone && <p className="text-rose-500 text-xs font-semibold mt-1.5">{validationErrors.phone}</p>}
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-6 border-t border-slate-100">Emergency Contact Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Contact Name</label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Relationship</label>
                <input
                  type="text"
                  name="emergencyContactRelation"
                  placeholder="e.g. Spouse, Father"
                  value={formData.emergencyContactRelation}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Contact Phone</label>
                <input
                  type="text"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Address Details */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800">Address Details</h3>
            
            {/* Present Address */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Present Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Address Line 1 *</label>
                  <input
                    type="text"
                    name="presentAddressLine1"
                    value={formData.presentAddressLine1}
                    onChange={handleChange}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white
                      ${validationErrors.presentAddressLine1 ? 'border-rose-400' : 'border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Address Line 2</label>
                  <input
                    type="text"
                    name="presentAddressLine2"
                    value={formData.presentAddressLine2}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">City *</label>
                  <input
                    type="text"
                    name="presentAddressCity"
                    value={formData.presentAddressCity}
                    onChange={handleChange}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white
                      ${validationErrors.presentAddressCity ? 'border-rose-400' : 'border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">State *</label>
                  <CreatableSelect
                    value={formData.presentAddressState}
                    onChange={(val) => handleChange({ target: { name: 'presentAddressState', value: val } })}
                    options={indiaStates}
                    placeholder="Select or type to add"
                  />
                  {validationErrors.presentAddressState && <p className="text-rose-500 text-xs font-semibold mt-1.5">{validationErrors.presentAddressState}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Country</label>
                  <CreatableSelect
                    value={formData.presentAddressCountry}
                    onChange={(val) => handleChange({ target: { name: 'presentAddressCountry', value: val } })}
                    options={commonCountries}
                    placeholder="Select or type to add"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Zip Code *</label>
                  <input
                    type="text"
                    name="presentAddressZip"
                    value={formData.presentAddressZip}
                    onChange={handleChange}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white
                      ${validationErrors.presentAddressZip ? 'border-rose-400' : 'border-slate-200'}`}
                  />
                  {validationErrors.presentAddressZip && <p className="text-rose-500 text-xs font-semibold mt-1.5">{validationErrors.presentAddressZip}</p>}
                </div>
              </div>
            </div>

            {/* Permanent Address Toggle */}
            <div className="pt-6 border-t border-slate-100">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 uppercase tracking-wider">
                <input
                  type="checkbox"
                  name="sameAsPresentAddress"
                  checked={formData.sameAsPresentAddress}
                  onChange={handleChange}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                Permanent Address is same as Present Address
              </label>
            </div>

            {/* Permanent Address */}
            {!formData.sameAsPresentAddress && (
              <div className="space-y-4 pt-4 animate-fade-in">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Permanent Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Address Line 1 *</label>
                    <input
                      type="text"
                      name="permanentAddressLine1"
                      value={formData.permanentAddressLine1}
                      onChange={handleChange}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white
                        ${validationErrors.permanentAddressLine1 ? 'border-rose-400' : 'border-slate-200'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Address Line 2</label>
                    <input
                      type="text"
                      name="permanentAddressLine2"
                      value={formData.permanentAddressLine2}
                      onChange={handleChange}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">City *</label>
                    <input
                      type="text"
                      name="permanentAddressCity"
                      value={formData.permanentAddressCity}
                      onChange={handleChange}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white
                        ${validationErrors.permanentAddressCity ? 'border-rose-400' : 'border-slate-200'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">State *</label>
                    <CreatableSelect
                      value={formData.permanentAddressState}
                      onChange={(val) => handleChange({ target: { name: 'permanentAddressState', value: val } })}
                      options={indiaStates}
                      placeholder="Select or type to add"
                    />
                    {validationErrors.permanentAddressState && <p className="text-rose-500 text-xs font-semibold mt-1.5">{validationErrors.permanentAddressState}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Country</label>
                    <CreatableSelect
                      value={formData.permanentAddressCountry}
                      onChange={(val) => handleChange({ target: { name: 'permanentAddressCountry', value: val } })}
                      options={commonCountries}
                      placeholder="Select or type to add"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Zip Code *</label>
                    <input
                      type="text"
                      name="permanentAddressZip"
                      value={formData.permanentAddressZip}
                      onChange={handleChange}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white
                        ${validationErrors.permanentAddressZip ? 'border-rose-400' : 'border-slate-200'}`}
                    />
                    {validationErrors.permanentAddressZip && <p className="text-rose-500 text-xs font-semibold mt-1.5">{validationErrors.permanentAddressZip}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Employment Details */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800">Job & Employment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  placeholder="Leave empty for auto-generation"
                  value={formData.employeeId}
                  onChange={handleChange}
                  disabled={!!employee}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Date of Joining *</label>
                <input
                  type="date"
                  name="dateOfJoining"
                  value={formData.dateOfJoining}
                  onChange={handleChange}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white
                    ${validationErrors.dateOfJoining ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'}`}
                />
                {validationErrors.dateOfJoining && <p className="text-rose-500 text-xs font-semibold mt-1.5">{validationErrors.dateOfJoining}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Employment Type</label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                >
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Department *</label>
                <CreatableSelect
                  value={formData.department}
                  onChange={(val) => handleChange({ target: { name: 'department', value: val } })}
                  options={departments}
                  placeholder="Select or type to search"
                  onAddNew={() => setShowAddDepartment(true)}
                  addNewText="New Department"
                />
                {validationErrors.department && <p className="text-rose-500 text-xs font-semibold mt-1.5">{validationErrors.department}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Designation *</label>
                <CreatableSelect
                  value={formData.designation}
                  onChange={(val) => handleChange({ target: { name: 'designation', value: val } })}
                  options={designations}
                  placeholder="Select or type to search"
                  onAddNew={() => setShowAddDesignation(true)}
                  addNewText="New Designation"
                />
                {validationErrors.designation && <p className="text-rose-500 text-xs font-semibold mt-1.5">{validationErrors.designation}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Work Location</label>
                <input
                  type="text"
                  name="workLocation"
                  value={formData.workLocation}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Resigned">Resigned</option>
                </select>
              </div>

              {formData.status === 'Resigned' && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Resignation Date</label>
                  <input
                    type="date"
                    name="resignationDate"
                    value={formData.resignationDate}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Bank Details */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Account Number</label>
                <input
                  type="text"
                  name="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={handleChange}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white
                    ${validationErrors.bankAccountNumber ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'}`}
                />
                {validationErrors.bankAccountNumber && <p className="text-rose-500 text-xs font-semibold mt-1.5">{validationErrors.bankAccountNumber}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Account Type</label>
                <select
                  name="bankAccountType"
                  value={formData.bankAccountType}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                >
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">IFSC Code</label>
                <input
                  type="text"
                  name="ifscCode"
                  placeholder="e.g. HDFC0001234"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white
                    ${validationErrors.ifscCode ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'}`}
                />
                {validationErrors.ifscCode && <p className="text-rose-500 text-xs font-semibold mt-1.5">{validationErrors.ifscCode}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Branch Name</label>
                <input
                  type="text"
                  name="bankBranchName"
                  value={formData.bankBranchName}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Tax & Compliance */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800">Tax & Compliance Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">PAN Number</label>
                <input
                  type="text"
                  name="panNumber"
                  placeholder="e.g. ABCDE1234F"
                  value={formData.panNumber}
                  onChange={handleChange}
                  onBlur={(e) => validateFieldUniqueness('panNumber', e.target.value)}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white
                    ${validationErrors.panNumber ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'}`}
                />
                {checkingUniqueness.panNumber && <p className="text-xs text-slate-400 mt-1">Verifying...</p>}
                {validationErrors.panNumber && <p className="text-rose-500 text-xs font-semibold mt-1.5">{validationErrors.panNumber}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Aadhaar Number</label>
                <input
                  type="text"
                  name="aadhaarNumber"
                  placeholder="12 digit Aadhaar"
                  value={formData.aadhaarNumber}
                  onChange={handleChange}
                  onBlur={(e) => validateFieldUniqueness('aadhaarNumber', e.target.value)}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-white
                    ${validationErrors.aadhaarNumber ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'}`}
                />
                {checkingUniqueness.aadhaarNumber && <p className="text-xs text-slate-400 mt-1">Verifying...</p>}
                {validationErrors.aadhaarNumber && <p className="text-rose-500 text-xs font-semibold mt-1.5">{validationErrors.aadhaarNumber}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">UAN / PF Number</label>
                <input
                  type="text"
                  name="pfNumber"
                  value={formData.pfNumber}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">ESI Number</label>
                <input
                  type="text"
                  name="esiNumber"
                  value={formData.esiNumber}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">PRAN / NPS Number</label>
                <input
                  type="text"
                  name="pranNumber"
                  value={formData.pranNumber}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Education & Experience */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800">Education & Work Experience</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Highest Qualification</label>
                <input
                  type="text"
                  name="highestQualification"
                  placeholder="e.g. B.Tech, MBA"
                  value={formData.highestQualification}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">University / College</label>
                <input
                  type="text"
                  name="universityCollege"
                  value={formData.universityCollege}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Year of Passing</label>
                <input
                  type="number"
                  name="yearOfPassing"
                  placeholder="e.g. 2020"
                  value={formData.yearOfPassing}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Previous Company Name</label>
                <input
                  type="text"
                  name="previousCompany"
                  value={formData.previousCompany}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Experience (Years)</label>
                <input
                  type="number"
                  step="0.1"
                  name="previousExperience"
                  placeholder="e.g. 4.5"
                  value={formData.previousExperience}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 8: Upload Photo & Final Review */}
        {currentStep === 8 && (
          <div className="space-y-8">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">Review & Photo Upload</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              {/* Photo Upload Box */}
              <div className="flex flex-col items-center gap-4 p-6 border border-slate-200 rounded-2xl bg-slate-50">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Passport Size Photo</h4>
                
                <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-white overflow-hidden relative shadow-inner">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-slate-300" size={48} />
                  )}
                </div>
                
                {photoPreview ? (
                  <div className="flex gap-2 relative mt-2 w-full justify-center">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      />
                      <button className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all hover:bg-slate-200 border border-slate-200 shadow-sm flex items-center gap-1">
                        Replace
                      </button>
                    </div>
                    <button 
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview('');
                        setFormData(prev => ({ ...prev, photoUrl: '' }));
                      }}
                      className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all hover:bg-rose-100 border border-rose-100 shadow-sm flex items-center gap-1"
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="relative mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                    />
                    <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-blue-100 shadow-sm flex items-center gap-1.5">
                      <Upload size={14} /> Upload Image
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 font-semibold text-center leading-relaxed">Supports JPG, PNG formats.<br/>Maximum size: 5MB.</p>
              </div>

              {/* Basic Review fields */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Onboarding Profile Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-500">
                  <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 uppercase tracking-wider block mb-1">Name</span>
                    <span className="text-slate-800 text-sm">{formData.firstName} {formData.middleName} {formData.lastName}</span>
                  </div>
                  <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 uppercase tracking-wider block mb-1">Work Email</span>
                    <span className="text-slate-800 text-sm">{formData.email}</span>
                  </div>
                  <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 uppercase tracking-wider block mb-1">Department / Designation</span>
                    <span className="text-slate-800 text-sm">{formData.department} — {formData.designation}</span>
                  </div>
                  <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 uppercase tracking-wider block mb-1">Joining Date</span>
                    <span className="text-slate-800 text-sm">{formData.dateOfJoining}</span>
                  </div>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex gap-3 text-xs text-blue-800 font-semibold leading-relaxed">
                  <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={16} />
                  Please verify that all fields look correct. By clicking the "Save Employee" button below, the profile will be created and activated in the payroll ledger directory.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stepper Buttons */}
        <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-200">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || saving}
            className="flex items-center gap-1 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 transition-all disabled:opacity-40 disabled:hover:bg-white bg-white"
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="flex gap-3">
            {currentStep < 8 ? (
              <button
                onClick={handleNext}
                disabled={saving}
                className="flex items-center gap-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-600/10 transition-all"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg shadow-blue-600/10 transition-all"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {employee ? 'Update Employee' : 'Save Employee'}
              </button>
            )}
          </div>
        </div>

        {/* Modals for Add New */}
        {showAddDepartment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">New Department</h3>
                <button onClick={() => setShowAddDepartment(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={e => setNewDepartment(e.target.value)}
                  className="w-full border border-blue-400 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  autoFocus
                />
              </div>
              <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-t border-slate-100">
                <div className="flex gap-3">
                  <button onClick={saveDepartment} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all">Save</button>
                  <button onClick={() => setShowAddDepartment(false)} className="px-5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">Cancel</button>
                </div>
                <span className="text-[10px] text-rose-500 font-semibold">* indicates mandatory fields</span>
              </div>
            </div>
          </div>
        )}

        {showAddDesignation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">New Designation</h3>
                <button onClick={() => setShowAddDesignation(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Designation Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDesignation}
                  onChange={e => setNewDesignation(e.target.value)}
                  className="w-full border border-blue-400 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  autoFocus
                />
              </div>
              <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-t border-slate-100">
                <div className="flex gap-3">
                  <button onClick={saveDesignation} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all">Save</button>
                  <button onClick={() => setShowAddDesignation(false)} className="px-5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">Cancel</button>
                </div>
                <span className="text-[10px] text-rose-500 font-semibold">* indicates mandatory fields</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
