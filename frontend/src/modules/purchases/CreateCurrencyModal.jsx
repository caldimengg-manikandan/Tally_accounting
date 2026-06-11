import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import useNotificationStore from '../../store/notificationStore';

const CURRENCY_MAP = {
  'AED': { symbol: 'د.إ', name: 'UAE Dirham' },
  'AFN': { symbol: '؋', name: 'Afghan Afghani' },
  'ALL': { symbol: 'L', name: 'Albanian Lek' },
  'AMD': { symbol: '֏', name: 'Armenian Dram' },
  'ANG': { symbol: 'ƒ', name: 'Netherlands Antillean Guilder' },
  'AOA': { symbol: 'Kz', name: 'Angolan Kwanza' },
  'ARS': { symbol: '$', name: 'Argentine Peso' },
  'AUD': { symbol: '$', name: 'Australian Dollar' },
  'AWG': { symbol: 'ƒ', name: 'Aruban Florin' },
  'AZN': { symbol: '₼', name: 'Azerbaijani Manat' },
  'BAM': { symbol: 'KM', name: 'Bosnia-Herzegovina Mark' },
  'BBD': { symbol: '$', name: 'Barbadian Dollar' },
  'BDT': { symbol: '৳', name: 'Bangladeshi Taka' },
  'BGN': { symbol: 'лв', name: 'Bulgarian Lev' },
  'BHD': { symbol: '.د.ب', name: 'Bahraini Dinar' },
  'BIF': { symbol: 'FBu', name: 'Burundian Franc' },
  'BMD': { symbol: '$', name: 'Bermudian Dollar' },
  'BND': { symbol: '$', name: 'Brunei Dollar' },
  'BOB': { symbol: '$b', name: 'Bolivian Boliviano' },
  'BRL': { symbol: 'R$', name: 'Brazilian Real' },
  'BSD': { symbol: '$', name: 'Bahamian Dollar' },
  'BTN': { symbol: 'Nu.', name: 'Bhutanese Ngultrum' },
  'BWP': { symbol: 'P', name: 'Botswanan Pula' },
  'BYN': { symbol: 'Br', name: 'Belarusian Ruble' },
  'BZD': { symbol: 'BZ$', name: 'Belize Dollar' },
  'CAD': { symbol: '$', name: 'Canadian Dollar' },
  'CDF': { symbol: 'FC', name: 'Congolese Franc' },
  'CHF': { symbol: 'CHF', name: 'Swiss Franc' },
  'CLP': { symbol: '$', name: 'Chilean Peso' },
  'CNY': { symbol: '¥', name: 'Chinese Yuan' },
  'COP': { symbol: '$', name: 'Colombian Peso' },
  'CRC': { symbol: '₡', name: 'Costa Rican Colón' },
  'CUC': { symbol: 'CUC$', name: 'Cuban Convertible Peso' },
  'CUP': { symbol: '₱', name: 'Cuban Peso' },
  'CVE': { symbol: '$', name: 'Cape Verdean Escudo' },
  'CZK': { symbol: 'Kč', name: 'Czech Koruna' },
  'DJF': { symbol: 'Fdj', name: 'Djiboutian Franc' },
  'DKK': { symbol: 'kr', name: 'Danish Krone' },
  'DOP': { symbol: 'RD$', name: 'Dominican Peso' },
  'DZD': { symbol: 'دج', name: 'Algerian Dinar' },
  'EGP': { symbol: '£', name: 'Egyptian Pound' },
  'ERN': { symbol: 'Nfk', name: 'Eritrean Nakfa' },
  'ETB': { symbol: 'Br', name: 'Ethiopian Birr' },
  'EUR': { symbol: '€', name: 'Euro' },
  'FJD': { symbol: '$', name: 'Fijian Dollar' },
  'FKP': { symbol: '£', name: 'Falkland Islands Pound' },
  'GBP': { symbol: '£', name: 'British Pound' },
  'GEL': { symbol: '₾', name: 'Georgian Lari' },
  'GGP': { symbol: '£', name: 'Guernsey Pound' },
  'GHS': { symbol: 'GH₵', name: 'Ghanaian Cedi' },
  'GIP': { symbol: '£', name: 'Gibraltar Pound' },
  'GMD': { symbol: 'D', name: 'Gambian Dalasi' },
  'GNF': { symbol: 'FG', name: 'Guinean Franc' },
  'GTQ': { symbol: 'Q', name: 'Guatemalan Quetzal' },
  'GYD': { symbol: '$', name: 'Guyanaese Dollar' },
  'HKD': { symbol: '$', name: 'Hong Kong Dollar' },
  'HNL': { symbol: 'L', name: 'Honduran Lempira' },
  'HRK': { symbol: 'kn', name: 'Croatian Kuna' },
  'HTG': { symbol: 'G', name: 'Haitian Gourde' },
  'HUF': { symbol: 'Ft', name: 'Hungarian Forint' },
  'IDR': { symbol: 'Rp', name: 'Indonesian Rupiah' },
  'ILS': { symbol: '₪', name: 'Israeli New Shekel' },
  'IMP': { symbol: '£', name: 'Isle of Man Pound' },
  'INR': { symbol: '₹', name: 'Indian Rupee' },
  'IQD': { symbol: 'ع.د', name: 'Iraqi Dinar' },
  'IRR': { symbol: '﷼', name: 'Iranian Rial' },
  'ISK': { symbol: 'kr', name: 'Icelandic Króna' },
  'JEP': { symbol: '£', name: 'Jersey Pound' },
  'JMD': { symbol: 'J$', name: 'Jamaican Dollar' },
  'JOD': { symbol: 'JD', name: 'Jordanian Dinar' },
  'JPY': { symbol: '¥', name: 'Japanese Yen' },
  'KES': { symbol: 'KSh', name: 'Kenyan Shilling' },
  'KGS': { symbol: 'лв', name: 'Kyrgystani Som' },
  'KHR': { symbol: '៛', name: 'Cambodian Riel' },
  'KMF': { symbol: 'CF', name: 'Comorian Franc' },
  'KPW': { symbol: '₩', name: 'North Korean Won' },
  'KRW': { symbol: '₩', name: 'South Korean Won' },
  'KWD': { symbol: 'KD', name: 'Kuwaiti Dinar' },
  'KYD': { symbol: '$', name: 'Cayman Islands Dollar' },
  'KZT': { symbol: 'лв', name: 'Kazakhstani Tenge' },
  'LAK': { symbol: '₭', name: 'Laotian Kip' },
  'LBP': { symbol: '£', name: 'Lebanese Pound' },
  'LKR': { symbol: '₨', name: 'Sri Lankan Rupee' },
  'LRD': { symbol: '$', name: 'Liberian Dollar' },
  'LSL': { symbol: 'L', name: 'Lesotho Loti' },
  'LYD': { symbol: 'LD', name: 'Libyan Dinar' },
  'MAD': { symbol: 'MAD', name: 'Moroccan Dirham' },
  'MDL': { symbol: 'lei', name: 'Moldovan Leu' },
  'MGA': { symbol: 'Ar', name: 'Malagasy Ariary' },
  'MKD': { symbol: 'ден', name: 'Macedonian Denar' },
  'MMK': { symbol: 'K', name: 'Myanmar Kyat' },
  'MNT': { symbol: '₮', name: 'Mongolian Tugrik' },
  'MOP': { symbol: 'MOP$', name: 'Macanese Pataca' },
  'MRU': { symbol: 'UM', name: 'Mauritanian Ouguiya' },
  'MUR': { symbol: '₨', name: 'Mauritian Rupee' },
  'MVR': { symbol: 'Rf', name: 'Maldivian Rufiyaa' },
  'MWK': { symbol: 'MK', name: 'Malawian Kwacha' },
  'MXN': { symbol: '$', name: 'Mexican Peso' },
  'MYR': { symbol: 'RM', name: 'Malaysian Ringgit' },
  'MZN': { symbol: 'MT', name: 'Mozambican Metical' }
};

const CreateCurrencyModal = ({ onClose, onSave }) => {
  const { addNotification } = useNotificationStore();
  const [formData, setFormData] = useState({
    code: '',
    symbol: '',
    name: '',
    decimalPlaces: '2',
    format: '1,234,567.89'
  });

  const currencyCodes = [
    'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN',
    'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL',
    'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY',
    'COP', 'CRC', 'CUC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD',
    'EGP', 'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GGP', 'GHS',
    'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HRK', 'HTG', 'HUF',
    'IDR', 'ILS', 'IMP', 'INR', 'IQD', 'IRR', 'ISK', 'JEP', 'JMD', 'JOD',
    'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD', 'KYD', 'KZT',
    'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD',
    'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN'
  ];

  const decimalOptions = ['0', '1', '2', '3', '4'];
  const formatOptions = ['1,234,567.89', '1.234.567,89', '1 234 567.89', '1,234,567'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-populate symbol and name if code is selected
    if (name === 'code' && CURRENCY_MAP[value]) {
       setFormData(prev => ({ 
          ...prev, 
          code: value,
          symbol: CURRENCY_MAP[value].symbol,
          name: CURRENCY_MAP[value].name 
       }));
    } else {
       setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    if (!formData.code || !formData.symbol || !formData.name) {
      addNotification("Please fill in all required fields marked with *", "warning");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[500px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <h2 className="text-[18px] font-bold text-slate-800">New Currency</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          
          {/* Currency Code */}
          <div className="space-y-2">
            <label className="text-[14px] font-medium text-red-500">Currency Code*</label>
            <div className="relative">
              <select 
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full h-11 pl-4 pr-10 text-[14px] border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none bg-white"
              >
                <option value="">Select</option>
                {currencyCodes.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Currency Symbol */}
          <div className="space-y-2">
            <label className="text-[14px] font-medium text-red-500">Currency Symbol*</label>
            <input 
              type="text"
              name="symbol"
              value={formData.symbol}
              onChange={handleChange}
              className="w-full h-11 px-4 text-[14px] border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              placeholder="e.g. ₹"
            />
          </div>

          {/* Currency Name */}
          <div className="space-y-2">
            <label className="text-[14px] font-medium text-red-500">Currency Name*</label>
            <input 
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full h-11 px-4 text-[14px] border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              placeholder="e.g. Indian Rupee"
            />
          </div>

          {/* Decimal Places */}
          <div className="space-y-2">
            <label className="text-[14px] font-medium text-slate-600">Decimal Places</label>
            <div className="relative">
              <select 
                name="decimalPlaces"
                value={formData.decimalPlaces}
                onChange={handleChange}
                className="w-full h-11 pl-4 pr-10 text-[14px] border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none bg-white"
              >
                {decimalOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <label className="text-[14px] font-medium text-slate-600">Format</label>
            <div className="relative">
              <select 
                name="format"
                value={formData.format}
                onChange={handleChange}
                className="w-full h-11 pl-4 pr-10 text-[14px] border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none bg-white"
              >
                {formatOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex items-center gap-3 mt-auto">
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-bold rounded-lg shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
            Save and Select
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[14px] font-bold rounded-lg active:scale-95 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCurrencyModal;
