import React from 'react';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const GSTInvoiceView = () => {
  const downloadInvoicePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(2, 132, 199);
    doc.text('TAX INVOICE', 140, 25);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Modern Solutions Pvt Ltd', 14, 20);
    doc.text('GSTIN: 29ABCDE1234F1Z5', 14, 25);
    
    autoTable(doc, {
      startY: 80,
      head: [['Description', 'HSN', 'Qty', 'Rate', 'Amount']],
      body: [['Software Consultation', '9983', '1.00', 'Rs 50,000.00', 'Rs 50,000.00']],
      headStyles: { fillStyle: 'fill', fillColor: [31, 41, 55] },
    });
    doc.save('Invoice_INV2024001.pdf');
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 max-w-4xl mx-auto animate-fade-up">
      <div className="flex justify-between items-start border-b pb-8 mb-8">
        <div>
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold mb-4 text-xl">T</div>
          <h3 className="text-lg font-bold">Modern Solutions Pvt Ltd</h3>
          <p className="text-sm text-gray-500">GSTIN: 29ABCDE1234F1Z5</p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-200 uppercase tracking-widest mb-4">Tax Invoice</h2>
          <p className="font-bold"># INV-2024-001</p>
        </div>
      </div>
      <div className="flex justify-end pt-8">
        <button onClick={downloadInvoicePDF} className="bg-ink-900 text-white px-8 py-4 rounded-xl font-bold shadow-xl flex items-center gap-2">
          <Download size={18} /> Download PDF Invoice
        </button>
      </div>
    </div>
  );
};

export default GSTInvoiceView;
