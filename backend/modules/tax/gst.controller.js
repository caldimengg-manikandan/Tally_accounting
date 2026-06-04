const { Voucher, Transaction, Ledger, Company, Group, SalesInvoice, SalesInvoiceItem, Item } = require('../../models');
const { Op } = require('sequelize');

// GSTR-1: Sales Report
exports.getGSTR1 = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Find all Sales Invoices
    const invoices = await SalesInvoice.findAll({
      where: { CompanyId: companyId, status: { [Op.notIn]: ['Draft', 'Void'] } },
      include: [
        { model: Ledger, as: 'CustomerLedger', attributes: ['id', 'name', 'gstNumber', 'state'] },
        { model: SalesInvoiceItem, as: 'items', include: [Item] }
      ]
    });

    const b2bInvoices = [];
    const rates = [0, 5, 12, 18, 28];
    const rateSummary = {};
    rates.forEach(r => {
      rateSummary[r] = { rate: r, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
    });

    const company = await Company.findByPk(companyId);
    const companyState = (company?.state || 'Maharashtra').trim().toLowerCase();

    invoices.forEach(inv => {
      const customer = inv.CustomerLedger;
      const customerState = (customer?.state || 'Maharashtra').trim().toLowerCase();
      const isLocal = companyState === customerState;

      let taxableValue = 0;
      let cgst = 0, sgst = 0, igst = 0;

      (inv.items || []).forEach(itemLine => {
        const qty = parseFloat(itemLine.quantity || 0);
        const rate = parseFloat(itemLine.rate || 0);
        const taxable = qty * rate;
        taxableValue += taxable;

        const gstRate = parseFloat(itemLine.Item?.gstRate || 18);
        const totalTax = taxable * (gstRate / 100);

        let itemCgst = 0, itemSgst = 0, itemIgst = 0;
        if (isLocal) {
          itemCgst = totalTax / 2;
          itemSgst = totalTax / 2;
          cgst += itemCgst;
          sgst += itemSgst;
        } else {
          itemIgst = totalTax;
          igst += itemIgst;
        }

        let matchedRate = rates.find(r => Math.abs(r - gstRate) < 0.1);
        if (matchedRate === undefined) matchedRate = 18;

        rateSummary[matchedRate].taxableValue += taxable;
        if (isLocal) {
          rateSummary[matchedRate].cgst += itemCgst;
          rateSummary[matchedRate].sgst += itemSgst;
        } else {
          rateSummary[matchedRate].igst += itemIgst;
        }
        rateSummary[matchedRate].totalTax += totalTax;
      });

      b2bInvoices.push({
        invoiceNumber: inv.invoiceNumber,
        date: inv.date,
        customerName: customer?.name || 'Walk-in Customer',
        customerGSTIN: customer?.gstNumber || 'Unregistered',
        state: customer?.state || 'Maharashtra',
        taxableValue: parseFloat(taxableValue.toFixed(2)),
        cgst: parseFloat(cgst.toFixed(2)),
        sgst: parseFloat(sgst.toFixed(2)),
        igst: parseFloat(igst.toFixed(2)),
        totalAmount: parseFloat((taxableValue + cgst + sgst + igst).toFixed(2))
      });
    });

    const rateSummaryList = Object.values(rateSummary).map(s => ({
      rate: s.rate,
      taxableValue: parseFloat(s.taxableValue.toFixed(2)),
      cgst: parseFloat(s.cgst.toFixed(2)),
      sgst: parseFloat(s.sgst.toFixed(2)),
      igst: parseFloat(s.igst.toFixed(2)),
      totalTax: parseFloat(s.totalTax.toFixed(2))
    }));

    res.json({
      companyId,
      b2bInvoices,
      rateSummary: rateSummaryList,
      totals: {
        taxableValue: parseFloat(b2bInvoices.reduce((s, i) => s + i.taxableValue, 0).toFixed(2)),
        cgst: parseFloat(b2bInvoices.reduce((s, i) => s + i.cgst, 0).toFixed(2)),
        sgst: parseFloat(b2bInvoices.reduce((s, i) => s + i.sgst, 0).toFixed(2)),
        igst: parseFloat(b2bInvoices.reduce((s, i) => s + i.igst, 0).toFixed(2)),
        totalAmount: parseFloat(b2bInvoices.reduce((s, i) => s + i.totalAmount, 0).toFixed(2))
      }
    });
  } catch (err) {
    console.error('getGSTR1 error:', err);
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
      const isCGST = name.includes('cgst');
      const isSGST = name.includes('sgst');
      const isIGST = name.includes('igst');

      const isOutput = name.includes('output') || name.includes('payable') || name.includes('sale') || name.includes('gst output') || name.includes('gst payable') || name.includes('output tax');
      const isInput = name.includes('input') || name.includes('receivable') || name.includes('purchase') || name.includes('itc') || name.includes('gst input') || name.includes('input tax');

      const debitTotal = l.Transactions?.reduce((s, t) => s + parseFloat(t.debit || 0), 0) || 0;
      const creditTotal = l.Transactions?.reduce((s, t) => s + parseFloat(t.credit || 0), 0) || 0;

      if (isCGST) {
        if (isInput) inputCGST += debitTotal - creditTotal;
        else outputCGST += creditTotal - debitTotal;
      } else if (isSGST) {
        if (isInput) inputSGST += debitTotal - creditTotal;
        else outputSGST += creditTotal - debitTotal;
      } else if (isIGST) {
        if (isInput) inputIGST += debitTotal - creditTotal;
        else outputIGST += creditTotal - debitTotal;
      } else if (isOutput) {
        const amount = creditTotal - debitTotal;
        outputCGST += amount / 2;
        outputSGST += amount / 2;
      } else if (isInput) {
        const amount = debitTotal - creditTotal;
        inputCGST += amount / 2;
        inputSGST += amount / 2;
      } else {
        if (creditTotal > debitTotal) {
          outputCGST += (creditTotal - debitTotal) / 2;
          outputSGST += (creditTotal - debitTotal) / 2;
        } else {
          inputCGST += (debitTotal - creditTotal) / 2;
          inputSGST += (debitTotal - creditTotal) / 2;
        }
      }
    });

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
