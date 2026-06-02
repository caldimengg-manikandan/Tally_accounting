const { Voucher, Transaction, Ledger, Company, Group } = require('../../models');
const { Op } = require('sequelize');

// GSTR-1: Sales Report
exports.getGSTR1 = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Find all Sales Vouchers (Invoices)
    const vouchers = await Voucher.findAll({
      where: { CompanyId: companyId, voucherType: 'Sales' },
      include: [{
        model: Transaction,
        include: [{ model: Ledger, attributes: ['id', 'name', 'gstNumber', 'state'] }]
      }]
    });

    const b2bInvoices = [];
    vouchers.forEach(v => {
      // 1. Find Customer row (Sundry Debtor)
      const customerTx = v.Transactions?.find(t => parseFloat(t.debit || 0) > 0 && t.Ledger?.gstNumber);
      if (!customerTx) return;

      const customer = customerTx.Ledger;
      const totalAmount = parseFloat(customerTx.debit || 0);

      // 2. Find Sales/Income row (Credit) and Tax rows
      const salesTx = v.Transactions?.find(t => parseFloat(t.credit || 0) > 0 && !t.Ledger?.gstNumber);
      const taxableValue = salesTx ? parseFloat(salesTx.credit || 0) : totalAmount;

      let cgst = 0, sgst = 0, igst = 0;
      v.Transactions?.forEach(t => {
        if (parseFloat(t.credit || 0) > 0) {
          const name = (t.Ledger?.name || '').toLowerCase();
          const amt = parseFloat(t.credit || 0);
          if (name.includes('cgst')) cgst += amt;
          else if (name.includes('sgst')) sgst += amt;
          else if (name.includes('igst')) igst += amt;
        }
      });

      b2bInvoices.push({
        invoiceNumber: v.voucherNumber,
        date: v.date,
        customerName: customer.name,
        customerGSTIN: customer.gstNumber,
        state: customer.state || 'Unknown',
        taxableValue,
        cgst,
        sgst,
        igst,
        totalAmount
      });
    });

    res.json({
      companyId,
      b2bInvoices,
      totals: {
        taxableValue: b2bInvoices.reduce((s, i) => s + i.taxableValue, 0),
        cgst: b2bInvoices.reduce((s, i) => s + i.cgst, 0),
        sgst: b2bInvoices.reduce((s, i) => s + i.sgst, 0),
        igst: b2bInvoices.reduce((s, i) => s + i.igst, 0),
        totalAmount: b2bInvoices.reduce((s, i) => s + i.totalAmount, 0)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GSTR-2A: Purchases Report (ITC lookup)
exports.getGSTR2A = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Find all Purchase Vouchers (Bills)
    const vouchers = await Voucher.findAll({
      where: { CompanyId: companyId, voucherType: 'Purchase' },
      include: [{
        model: Transaction,
        include: [{ model: Ledger, attributes: ['id', 'name', 'gstNumber', 'state'] }]
      }]
    });

    const b2bPurchases = [];
    vouchers.forEach(v => {
      // 1. Find Vendor row (Sundry Creditor)
      const vendorTx = v.Transactions?.find(t => parseFloat(t.credit || 0) > 0 && t.Ledger?.gstNumber);
      if (!vendorTx) return;

      const vendor = vendorTx.Ledger;
      const totalAmount = parseFloat(vendorTx.credit || 0);

      // 2. Find purchase/expense debits and tax debits
      const purchaseTx = v.Transactions?.find(t => parseFloat(t.debit || 0) > 0 && !t.Ledger?.gstNumber);
      const taxableValue = purchaseTx ? parseFloat(purchaseTx.debit || 0) : totalAmount;

      let cgst = 0, sgst = 0, igst = 0;
      v.Transactions?.forEach(t => {
        if (parseFloat(t.debit || 0) > 0) {
          const name = (t.Ledger?.name || '').toLowerCase();
          const amt = parseFloat(t.debit || 0);
          if (name.includes('cgst')) cgst += amt;
          else if (name.includes('sgst')) sgst += amt;
          else if (name.includes('igst')) igst += amt;
        }
      });

      b2bPurchases.push({
        billNumber: v.voucherNumber,
        date: v.date,
        vendorName: vendor.name,
        vendorGSTIN: vendor.gstNumber,
        state: vendor.state || 'Unknown',
        taxableValue,
        cgst,
        sgst,
        igst,
        totalAmount
      });
    });

    res.json({
      companyId,
      b2bPurchases,
      totals: {
        taxableValue: b2bPurchases.reduce((s, p) => s + p.taxableValue, 0),
        cgst: b2bPurchases.reduce((s, p) => s + p.cgst, 0),
        sgst: b2bPurchases.reduce((s, p) => s + p.sgst, 0),
        igst: b2bPurchases.reduce((s, p) => s + p.igst, 0),
        totalAmount: b2bPurchases.reduce((s, p) => s + p.totalAmount, 0)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GSTR-3B: Final GST returns calculations
exports.getGSTR3B = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Fetch all transaction lines for duties and taxes
    const taxGroup = await Group.findOne({
      where: { CompanyId: companyId, name: { [Op.like]: '%Duties%' } }
    });

    const taxGroupIds = taxGroup ? [taxGroup.id] : [];
    if (taxGroup) {
      const subGroups = await Group.findAll({ where: { CompanyId: companyId, parent_id: taxGroup.id } });
      subGroups.forEach(sg => taxGroupIds.push(sg.id));
    }

    const taxLedgers = await Ledger.findAll({
      where: { CompanyId: companyId, GroupId: { [Op.in]: taxGroupIds } },
      include: [{ model: Transaction }]
    });

    let outputCGST = 0, outputSGST = 0, outputIGST = 0;
    let inputCGST = 0, inputSGST = 0, inputIGST = 0;

    taxLedgers.forEach(l => {
      const name = (l.name || '').toLowerCase();
      const isOutput = name.includes('output') || name.includes('payable') || name.includes('sale');
      const isInput = name.includes('input') || name.includes('receivable') || name.includes('purchase') || name.includes('itc');

      const debitTotal = l.Transactions?.reduce((s, t) => s + parseFloat(t.debit || 0), 0) || 0;
      const creditTotal = l.Transactions?.reduce((s, t) => s + parseFloat(t.credit || 0), 0) || 0;

      if (name.includes('cgst')) {
        if (isInput) inputCGST += debitTotal - creditTotal;
        else outputCGST += creditTotal - debitTotal;
      } else if (name.includes('sgst')) {
        if (isInput) inputSGST += debitTotal - creditTotal;
        else outputSGST += creditTotal - debitTotal;
      } else if (name.includes('igst')) {
        if (isInput) inputIGST += debitTotal - creditTotal;
        else outputIGST += creditTotal - debitTotal;
      } else {
        // Unspecified fallback (split 50/50 output/input by default nature of transaction)
        if (creditTotal > debitTotal) {
          outputCGST += (creditTotal - debitTotal) / 2;
          outputSGST += (creditTotal - debitTotal) / 2;
        } else {
          inputCGST += (debitTotal - creditTotal) / 2;
          inputSGST += (debitTotal - creditTotal) / 2;
        }
      }
    });

    // Make sure we don't return negative values
    outputCGST = Math.max(0, outputCGST);
    outputSGST = Math.max(0, outputSGST);
    outputIGST = Math.max(0, outputIGST);
    inputCGST = Math.max(0, inputCGST);
    inputSGST = Math.max(0, inputSGST);
    inputIGST = Math.max(0, inputIGST);

    const totalOutputLiability = outputCGST + outputSGST + outputIGST;
    const totalInputCredit = inputCGST + inputSGST + inputIGST;
    const netGSTPayable = Math.max(0, totalOutputLiability - totalInputCredit);

    res.json({
      companyId,
      outputTax: { cgst: outputCGST, sgst: outputSGST, igst: outputIGST, total: totalOutputLiability },
      inputTaxCredit: { cgst: inputCGST, sgst: inputSGST, igst: inputIGST, total: totalInputCredit },
      netPayable: netGSTPayable
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
