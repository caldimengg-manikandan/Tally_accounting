import React, { useState } from 'react';
import { TrendingUp, Package, BookOpen, Clock, Receipt, CheckCircle2, AlertCircle } from 'lucide-react';

const AIScannerView = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const simulateScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        merchant: "Amazon Cloud Services",
        date: "17 Mar 2024",
        amount: "₹1,240.00",
        tax: "₹223.20",
        category: "Software Subscription",
        confidence: "98.4%"
      });
    }, 3000);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">AI Bookkeeper</h3>
          <p className="opacity-80 font-medium">Upload any receipt and let our AI engine handle the debit/credit logic for you.</p>
          
          {!scanResult && !isScanning && (
            <label className="mt-8 border-2 border-dashed border-white/30 rounded-3xl p-12 text-center hover:bg-white/5 transition-all cursor-pointer block">
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => {
                if(e.target.files && e.target.files.length > 0) simulateScan();
              }} />
              <Package size={40} className="mx-auto mb-4" />
              <p className="font-bold text-lg">Click to Upload Receipt</p>
            </label>
          )}

          {isScanning && (
            <div className="mt-8 bg-white/5 backdrop-blur-md rounded-3xl p-12 text-center border border-white/10 animate-pulse">
               <div className="w-16 h-16 border-4 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
               <p className="font-bold text-xl">AI is Reading your Receipt...</p>
            </div>
          )}

          {scanResult && (
            <div className="mt-8 bg-white text-gray-900 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-500">
               <div className="flex justify-between items-start mb-6">
                  <h4 className="text-2xl font-bold">{scanResult.merchant}</h4>
                  <p className="text-emerald-500 font-bold">{scanResult.confidence}</p>
               </div>
               <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-2xl">
                     <p className="text-[10px] font-bold text-gray-400 uppercase">Total Amount</p>
                     <p className="text-xl font-bold">{scanResult.amount}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl">
                     <p className="text-[10px] font-bold text-gray-400 uppercase">GST Included</p>
                     <p className="text-xl font-bold">{scanResult.tax}</p>
                  </div>
               </div>
               <button onClick={() => setScanResult(null)} className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold">Post to Ledger</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIScannerView;
