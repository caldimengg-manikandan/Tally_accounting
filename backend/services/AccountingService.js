const { Voucher, Transaction, Ledger, sequelize } = require('../models');

class AccountingService {
  /**
   * Universal Journal Engine: The absolute core of the accounting system.
   * Enhanced with: Production Audit Logging, Real-time Balances, and Double-Entry Validation.
   */
  static async recordJournalEntry({ 
    companyId, date, narration, reference, voucherType = 'Journal', entries, userId 
  }, dbTransaction = null) {
    const { AuditLog } = require('../models');
    const options = dbTransaction ? { transaction: dbTransaction } : {};

    // 1. Validate Balance (Dr = Cr)
    const totalDebit = entries.reduce((sum, e) => sum + (parseFloat(e.debit) || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + (parseFloat(e.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`INTEGRITY ERROR: Unbalanced journal entry. Debits (₹${totalDebit}) != Credits (₹${totalCredit})`);
    }

    if (totalDebit <= 0 && entries.length > 0) {
      throw new Error('INTEGRITY ERROR: Journal entry must have a non-zero positive value.');
    }

    // 2. Create Voucher Header with Auto-Numbering
    const prefix = voucherType.substring(0, 3).toUpperCase();
    const count = await Voucher.count({ where: { CompanyId: companyId, voucherType }, ...options });
    const voucherNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const voucher = await Voucher.create({
      CompanyId: companyId,
      voucherType,
      voucherNumber,
      date: date || new Date(),
      reference,
      narration: narration || `Auto-generated ${voucherType} entry`,
    }, options);

    // 3. Create Transaction Lines & Update Ledger Balances
    for (const entry of entries) {
      if (!entry.ledgerId) throw new Error('INTEGRITY ERROR: Missing Ledger ID in transaction line.');
      
      await Transaction.create({
        VoucherId: voucher.id,
        LedgerId: entry.ledgerId,
        debit: parseFloat(entry.debit || 0),
        credit: parseFloat(entry.credit || 0),
        CompanyId: companyId
      }, options);

      // Real-time Balance Update (Tally Standard)
      const ledger = await Ledger.findByPk(entry.ledgerId, options);
      if (ledger) {
        const delta = parseFloat(entry.debit || 0) - parseFloat(entry.credit || 0);
        ledger.currentBalance = parseFloat(ledger.currentBalance || 0) + delta;
        await ledger.save(options);
      }
    }

    // 4. Audit Log Injection (Fraud Prevention)
    if (AuditLog) {
      await AuditLog.create({
        action: 'CREATE_VOUCHER',
        tableName: 'Vouchers',
        recordId: voucher.id,
        newData: { 
          voucherNumber, 
          voucherType, 
          totalValue: totalDebit, 
          lines: entries.length 
        },
        CompanyId: companyId,
        UserId: userId
      }, options);
    }

    return voucher;
  }

  /**
   * Professional Tax Invoice Engine (GST Compliant)
   * Enhanced with: Negative Stock Protection, Integrated Inventory, and Audit Trails.
   */
  static async recordTaxInvoice({ 
    companyId, customerLedgerId, date, narration, items, type = 'Sales', userId 
  }, dbTransaction = null) {
    const { Item } = require('../models');
    const options = dbTransaction ? { transaction: dbTransaction } : {};
    
    let totalTaxableValue = 0;
    let totalGstAmount = 0;
    
    // 1. Calculate & VALIDATE STOCK (Negative Stock Safety)
    const processedItems = [];
    for (const itemData of items) {
      const item = await Item.findByPk(itemData.itemId, options);
      if (!item) throw new Error(`STOCK ERROR: Item ID ${itemData.itemId} not found.`);

      if (parseFloat(item.currentStock) < parseFloat(itemData.quantity)) {
        throw new Error(`INSUFFICIENT STOCK: Cannot sell ${itemData.quantity} ${item.unit} of "${item.name}". Only ${item.currentStock} remaining.`);
      }

      const taxable = parseFloat(itemData.quantity) * parseFloat(itemData.rate);
      const tax = taxable * (parseFloat(itemData.gstRate || 18) / 100);
      totalTaxableValue += taxable;
      totalGstAmount += tax;
      processedItems.push({ ...itemData, item, taxable, tax });
    }

    const grandTotal = totalTaxableValue + totalGstAmount;

    // 2. Identify Target Ledgers for auto-posting
    const { Group } = require('../models');
    const { Op } = require('sequelize');
    
    const salesGroup = await Group.findOne({ where: { CompanyId: companyId, name: 'Sales Accounts' }, ...options });
    let salesLedger = null;
    if (salesGroup) {
        salesLedger = await Ledger.findOne({ where: { CompanyId: companyId, GroupId: salesGroup.id }, ...options });
    }
    if (!salesLedger) {
        salesLedger = await Ledger.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%Sales%' } }, ...options });
    }
    
    const cgstLedger = await Ledger.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%CGST%' } }, ...options });
    const sgstLedger = await Ledger.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%SGST%' } }, ...options });
    
    const missing = [];
    if (!salesLedger) missing.push('Sales Ledger');
    if (!cgstLedger) missing.push('CGST Ledger');
    if (!sgstLedger) missing.push('SGST Ledger');

    if (missing.length > 0) {
      throw new Error(`CONFIG ERROR: Missing ledgers -> ${missing.join(', ')}`);
    }

    const halfTax = totalGstAmount / 2;

    // 3. Construct Journal Entries (4 Lines perfectly)
    const journalEntries = [
      { ledgerId: customerLedgerId, debit: grandTotal, credit: 0 },
      { ledgerId: salesLedger.id, debit: 0, credit: totalTaxableValue },
      { ledgerId: cgstLedger.id, debit: 0, credit: halfTax },
      { ledgerId: sgstLedger.id, debit: 0, credit: halfTax }
    ];

    // 4. Post to Universal Journal Engine (which handles Audit)
    const voucher = await this.recordJournalEntry({
      companyId,
      date,
      voucherType: type,
      narration: narration || `Tax Invoice Post: ${totalTaxableValue.toFixed(2)} + GST`,
      entries: journalEntries,
      userId
    }, dbTransaction);

    // 5. Update Inventory & Metadata Linkage
    for (const pItem of processedItems) {
      const item = pItem.item;
      item.currentStock = parseFloat(item.currentStock) - parseFloat(pItem.quantity);
      await item.save(options);

      // Link Item metadata to the Sales Transaction line
      await Transaction.update({
        quantity: pItem.quantity,
        rate: pItem.rate,
        unit: item.unit,
        gstRate: pItem.gstRate,
        gstAmount: pItem.tax,
        ItemId: item.id
      }, {
        where: { VoucherId: voucher.id, LedgerId: salesLedger.id },
        limit: 1, 
        ...options
      });
    }

    return { voucher, grandTotal, totalTaxableValue, totalGstAmount };
  }
}

module.exports = AccountingService;
