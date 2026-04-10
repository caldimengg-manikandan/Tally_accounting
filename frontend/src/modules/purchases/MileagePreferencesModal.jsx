import React, { useState } from 'react';
import { X, Plus, XCircle } from 'lucide-react';

const MileagePreferencesModal = ({ onClose }) => {
  const [associateEmployees, setAssociateEmployees] = useState(false);
  const [category, setCategory] = useState('Fuel/Mileage Expenses');
  const [unit, setUnit] = useState('Km');
  const [rates, setRates] = useState([{ id: 1, startDate: '', rate: '' }]);

  const addRate = () => {
    setRates([...rates, { id: Date.now(), startDate: '', rate: '' }]);
  };

  const removeRate = (id) => {
    if (rates.length > 1) {
      setRates(rates.filter(rate => rate.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-w-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl text-red-500 font-medium">Set your mileage preferences</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="flex items-center gap-2 mb-8">
            <input 
              type="checkbox" 
              id="associate" 
              checked={associateEmployees}
              onChange={(e) => setAssociateEmployees(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="associate" className="text-[14px] text-gray-700">Associate employees to expenses</label>
          </div>

          <h3 className="text-[16px] text-gray-800 font-medium mb-6">Mileage Preference</h3>

          <div className="grid grid-cols-[200px_1fr] gap-6 mb-6 items-center">
            <label className="text-[14px] text-gray-700">Default Mileage Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-[14px] w-[200px] focus:outline-none focus:border-blue-500"
            >
              <option value="Office Supplies">Office Supplies</option>
              <option value="Advertising And Marketing">Advertising And Marketing</option>
              <option value="Bank Fees and Charges">Bank Fees and Charges</option>
              <option value="Credit Card Charges">Credit Card Charges</option>
              <option value="Travel Expense">Travel Expense</option>
              <option value="Telephone Expense">Telephone Expense</option>
              <option value="Automobile Expense">Automobile Expense</option>
              <option value="IT and Internet Expenses">IT and Internet Expenses</option>
              <option value="Rent Expense">Rent Expense</option>
              <option value="Janitorial Expense">Janitorial Expense</option>
              <option value="Postage">Postage</option>
              <option value="Bad Debt">Bad Debt</option>
              <option value="Printing and Stationery">Printing and Stationery</option>
              <option value="Salaries and Employee Wages">Salaries and Employee Wages</option>
              <option value="Meals and Entertainment">Meals and Entertainment</option>
              <option value="Depreciation Expense">Depreciation Expense</option>
              <option value="Consultant Expense">Consultant Expense</option>
              <option value="Repairs and Maintenance">Repairs and Maintenance</option>
              <option value="Other Expenses">Other Expenses</option>
              <option value="Lodging">Lodging</option>
              <option value="Purchase Discounts">Purchase Discounts</option>
              <option value="Raw Materials And Consumables">Raw Materials And Consumables</option>
              <option value="Merchandise">Merchandise</option>
              <option value="Transportation Expense">Transportation Expense</option>
              <option value="Depreciation And Amortisation">Depreciation And Amortisation</option>
              <option value="Contract Assets">Contract Assets</option>
              <option value="Fuel/Mileage Expenses">Fuel/Mileage Expenses</option>
            </select>
          </div>

          <div className="grid grid-cols-[200px_1fr] gap-6 mb-8 items-center">
            <label className="text-[14px] text-gray-700">Default Unit</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-[14px] text-gray-700 cursor-pointer">
                <input type="radio" checked={unit === 'Km'} onChange={() => setUnit('Km')} name="unit" className="w-4 h-4 text-blue-600" /> Km
              </label>
              <label className="flex items-center gap-2 text-[14px] text-gray-700 cursor-pointer">
                <input type="radio" checked={unit === 'Mile'} onChange={() => setUnit('Mile')} name="unit" className="w-4 h-4 text-blue-600" /> Mile
              </label>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-[14px] text-gray-800 font-medium tracking-wider mb-2 uppercase">Mileage Rates</h3>
            <p className="text-[13px] text-gray-500 leading-relaxed mb-6">
              Any mileage expense recorded on or after the start date will have the corresponding mileage rate. You can create a default rate (created without specifying a date), which will be applicable for mileage expenses recorded before the initial start date.
            </p>
          </div>

          <div className="border border-gray-200 rounded-md mb-4 bg-gray-50/50">
            <div className="grid grid-cols-2 bg-gray-50 border-b border-gray-200 p-3">
              <div className="text-[12px] font-semibold text-blue-600/70 tracking-wider">START DATE</div>
              <div className="text-[12px] font-semibold text-blue-600/70 tracking-wider">MILEAGE RATE</div>
            </div>
            
            <div className="p-3 space-y-3">
              {rates.map((rate, index) => (
                <div key={rate.id} className="flex items-center gap-4">
                  <div>
                    <input 
                      type="text" 
                      placeholder="dd/MM/yyyy" 
                      className="border border-gray-300 rounded-md px-3 py-2 text-[14px] w-[140px] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden w-[140px] focus-within:border-blue-500">
                      <span className="bg-gray-50 px-3 py-2 text-[13px] text-gray-600 border-r border-gray-300">INR</span>
                      <input type="text" className="w-full px-2 py-2 text-[14px] focus:outline-none" />
                    </div>
                  </div>
                  <button 
                    onClick={() => removeRate(rate.id)}
                    disabled={rates.length === 1}
                    className="ml-8 text-gray-400 hover:text-red-500 disabled:opacity-0 transition-opacity p-1"
                  >
                    <XCircle size={18} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button onClick={addRate} className="text-blue-600 text-[14px] font-medium flex items-center gap-1 hover:text-blue-700">
            <Plus size={16} strokeWidth={3} /> Add Mileage Rate
          </button>
        </div>

        {/* Footer */}
        <div className="p-5 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button onClick={onClose} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-md font-medium text-[14px]">
            Save
          </button>
          <button onClick={onClose} className="bg-white border text-gray-700 border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md text-[14px]">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MileagePreferencesModal;
