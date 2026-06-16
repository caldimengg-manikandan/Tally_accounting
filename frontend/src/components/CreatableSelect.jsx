import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Plus, Check, X } from 'lucide-react';

export default function CreatableSelect({ 
  value, 
  onChange, 
  options = [], 
  label, 
  placeholder = "Select", 
  onAddNew, 
  addNewText = "New Item",
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div 
        className={`flex items-center justify-between border rounded-xl px-4 py-2.5 bg-white cursor-pointer transition-all ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-sm ${value ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-2 text-gray-400">
          {value && (
            <button 
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="hover:text-gray-600 focus:outline-none"
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-gray-50">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-all ${
                    value === opt 
                      ? 'bg-blue-500 text-white font-medium' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  {opt}
                  {value === opt && <Check size={16} />}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No results found
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 p-1">
            <button
              onClick={() => {
                setIsOpen(false);
                if (onAddNew) onAddNew();
              }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus size={16} /> {addNewText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
