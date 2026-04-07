/**
 * Accounting Service
 * Handles GST calculations and AI OCR Simulation
 */

exports.calculateGST = (amount, rate, isInterstate = false) => {
  const totalTax = (amount * rate) / 100;
  
  if (isInterstate) {
    return {
      igst: totalTax,
      cgst: 0,
      sgst: 0,
      total: amount + totalTax
    };
  } else {
    return {
      igst: 0,
      cgst: totalTax / 2,
      sgst: totalTax / 2,
      total: amount + totalTax
    };
  }
};

exports.calculateProfessionalGST = (amount, rate, isInterstate = false) => {
  const totalTax = (parseFloat(amount) * parseFloat(rate)) / 100;
  
  if (isInterstate) {
    return {
      taxItems: [
        { name: 'IGST', rate, amount: totalTax }
      ],
      totalTax
    };
  } else {
    return {
      taxItems: [
        { name: 'CGST', rate: rate/2, amount: totalTax/2 },
        { name: 'SGST', rate: rate/2, amount: totalTax/2 }
      ],
      totalTax
    };
  }
};

exports.simulateAIOCR = async (fileName) => {
  // In a real app, you would use Tesseract.js or OpenAI Vision API here
  console.log(`Scanning receipt: ${fileName}...`);
  
  // Simulated Extraction
  return {
    merchant: "Amazon Business",
    date: new Date().toISOString().split('T')[0],
    totalAmount: 1250.00,
    taxAmount: 225.00,
    items: [
      { description: "Wireless Mouse", amount: 1000.00, taxRate: 18 }
    ],
    confidence: 0.98
  };
};
