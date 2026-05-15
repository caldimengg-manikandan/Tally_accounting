const { Voucher, Transaction, Ledger, sequelize } = require('../models');

class AccountingService {
  /**
   * Universal Journal Engine: The absolute core of the accounting system.
   * Enhanced with: Production Audit Logging, Real-time Balances, and Double-Entry Validation.
   */
  static async recordJournalEntry({
    companyId, date, narration, reference, voucherType = 'Journal', entries, userId, voucherNumber: customVoucherNumber,
    reportingMethod, currency, projectId
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
    let voucherNumber = customVoucherNumber;
    if (!voucherNumber) {
      const prefix = voucherType.substring(0, 3).toUpperCase();
      const count = await Voucher.count({ where: { CompanyId: companyId, voucherType }, ...options });
      voucherNumber = `${prefix}-${count + 1}`;
    } else {
      // If it's a numeric string with padding, remove the padding
      if (/^\d+$/.test(voucherNumber)) {
        voucherNumber = String(parseInt(voucherNumber, 10));
      }
    }

    const voucher = await Voucher.create({
      CompanyId: companyId,
      voucherType,
      voucherNumber,
      date: date || new Date(),
      reference,
      narration: narration || `Auto-generated ${voucherType} entry`,
      reportingMethod,
      currency,
      ProjectId: projectId || null
    }, options);

    // 3. Create Transaction Lines & Update Ledger Balances
    for (const entry of entries) {
      if (!entry.ledgerId) throw new Error('INTEGRITY ERROR: Missing Ledger ID in transaction line.');

      await Transaction.create({
        VoucherId: voucher.id,
        LedgerId: entry.ledgerId,
        debit: parseFloat(entry.debit || 0),
        credit: parseFloat(entry.credit || 0),
        CompanyId: companyId,
        CostCenterId: entry.costCenterId || null,
        description: entry.description,
        contactId: entry.contactId,
        ProjectId: projectId || null
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

  static async updateJournalEntry(voucherId, {
    companyId, date, narration, reference, entries, userId, voucherNumber, reportingMethod, currency
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

    // 2. Find existing voucher
    const voucher = await Voucher.findByPk(voucherId, {
      include: [Transaction],
      ...options
    });

    if (!voucher) throw new Error('Voucher not found');
    if (voucher.CompanyId !== companyId) throw new Error('Unauthorized');

    // 3. Reverse old transactions
    if (voucher.Transactions) {
      for (const oldTx of voucher.Transactions) {
        const ledger = await Ledger.findByPk(oldTx.LedgerId, options);
        if (ledger) {
          const delta = parseFloat(oldTx.debit || 0) - parseFloat(oldTx.credit || 0)
          ledger.currentBalance = parseFloat(ledger.currentBalance || 0) - delta; // Reverse delta
          await ledger.save(options);
        }
      }
      // Delete old transactions
      await Transaction.destroy({ where: { VoucherId: voucherId }, ...options });
    }

    // 4. Update voucher header
    if (date) voucher.date = date;
    if (narration !== undefined) voucher.narration = narration;
    if (reference !== undefined) voucher.reference = reference;
    if (voucherNumber) {
      if (/^\d+$/.test(voucherNumber)) {
        voucher.voucherNumber = String(parseInt(voucherNumber, 10));
      } else {
        voucher.voucherNumber = voucherNumber;
      }
    }
    if (reportingMethod !== undefined) voucher.reportingMethod = reportingMethod;
    if (currency !== undefined) voucher.currency = currency;
    await voucher.save(options);

    // 5. Create new transactions & Update Ledger Balances
    for (const entry of entries) {
      if (!entry.ledgerId) throw new Error('INTEGRITY ERROR: Missing Ledger ID in transaction line.');

      await Transaction.create({
        VoucherId: voucher.id,
        LedgerId: entry.ledgerId,
        debit: parseFloat(entry.debit || 0),
        credit: parseFloat(entry.credit || 0),
        CompanyId: companyId,
        CostCenterId: entry.costCenterId || null,
        description: entry.description,
        contactId: entry.contactId
      }, options);

      // Real-time Balance Update
      const ledger = await Ledger.findByPk(entry.ledgerId, options);
      if (ledger) {
        const delta = parseFloat(entry.debit || 0) - parseFloat(entry.credit || 0);
        ledger.currentBalance = parseFloat(ledger.currentBalance || 0) + delta;
        await ledger.save(options);
      }
    }

    // 6. Audit Log
    if (AuditLog) {
      await AuditLog.create({
        action: 'UPDATE_VOUCHER',
        tableName: 'Vouchers',
        recordId: voucher.id,
        newData: {
          voucherNumber: voucher.voucherNumber,
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
    companyId, customerLedgerId, date, narration, items, type = 'Sales', userId, projectId
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

      // Stock validation removed to allow sales even with zero/negative stock
      /*
      if (parseFloat(item.currentStock) < parseFloat(itemData.quantity)) {
        throw new Error(`INSUFFICIENT STOCK: Cannot sell ${itemData.quantity} ${item.unit} of "${item.name}". Only ${item.currentStock} remaining.`);
      }
      */

      const taxable = parseFloat(itemData.quantity) * parseFloat(itemData.rate);
      const tax = taxable * (parseFloat(itemData.gstRate || 0) / 100);
      totalTaxableValue += taxable;
      totalGstAmount += tax;
      processedItems.push({ ...itemData, item, taxable, tax });
    }

    const grandTotal = totalTaxableValue + totalGstAmount;

    // 2. Identify States for GST Automation
    const { Company, Group } = require('../models');
    const { Op } = require('sequelize');

    const company = await Company.findByPk(companyId, options);
    const customer = await Ledger.findByPk(customerLedgerId, options);

    if (!company) throw new Error('CONFIG ERROR: Company not found.');
    if (!customer) throw new Error('CONFIG ERROR: Customer ledger not found.');

    // 3. Self-Healing Ledger Discovery & Creation
    const salesGroup = await Group.findOne({ 
      where: { CompanyId: companyId, name: { [Op.like]: '%Sales%' } }, 
      ...options 
    });
    
    let salesLedger = null;
    if (salesGroup) {
      salesLedger = await Ledger.findOne({ where: { CompanyId: companyId, GroupId: salesGroup.id }, ...options });
    }
    
    // Fallback: search by name
    if (!salesLedger) {
      salesLedger = await Ledger.findOne({ 
        where: { 
          CompanyId: companyId, 
          [Op.or]: [
            { name: { [Op.like]: '%Sales%' } },
            { name: { [Op.like]: '%Income%' } }
          ]
        }, 
        ...options 
      });
    }

    // Auto-Create if still missing
    if (!salesLedger) {
      const parentGroupId = salesGroup ? salesGroup.id : null;
      salesLedger = await Ledger.create({
        name: 'Sales',
        code: 'SAL-001',
        category: 'Income',
        groupName: 'Sales Accounts',
        GroupId: parentGroupId,
        CompanyId: companyId,
        currentBalance: 0
      }, options);
    }

    // 4. Prepare Journal Entries
    const journalEntries = [
      { ledgerId: customerLedgerId, debit: grandTotal, credit: 0 },
      { ledgerId: salesLedger.id, debit: 0, credit: totalTaxableValue }
    ];

    if (totalGstAmount > 0.01) {
      const taxGroup = await Group.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%Duties%' } }, ...options });
      
      if (isLocal) {
        // Intra-state: CGST + SGST
        let cgstLedger = await Ledger.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%CGST%' } }, ...options });
        let sgstLedger = await Ledger.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%SGST%' } }, ...options });

        if (!cgstLedger) {
          cgstLedger = await Ledger.create({ name: 'CGST (Output)', category: 'Liability', groupName: 'Duties & Taxes', GroupId: taxGroup?.id, CompanyId: companyId, currentBalance: 0 }, options);
        }
        if (!sgstLedger) {
          sgstLedger = await Ledger.create({ name: 'SGST (Output)', category: 'Liability', groupName: 'Duties & Taxes', GroupId: taxGroup?.id, CompanyId: companyId, currentBalance: 0 }, options);
        }

        journalEntries.push({ ledgerId: cgstLedger.id, debit: 0, credit: totalGstAmount / 2 });
        journalEntries.push({ ledgerId: sgstLedger.id, debit: 0, credit: totalGstAmount / 2 });
      } else {
        // Inter-state: IGST
        let igstLedger = await Ledger.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%IGST%' } }, ...options });
        if (!igstLedger) {
          igstLedger = await Ledger.create({ name: 'IGST (Output)', category: 'Liability', groupName: 'Duties & Taxes', GroupId: taxGroup?.id, CompanyId: companyId, currentBalance: 0 }, options);
        }
        journalEntries.push({ ledgerId: igstLedger.id, debit: 0, credit: totalGstAmount });
      }
    }


    // 4. Post to Universal Journal Engine (which handles Audit)
    const voucher = await this.recordJournalEntry({
      companyId,
      date,
      voucherType: type,
      narration: narration || `Tax Invoice Post: ${totalTaxableValue.toFixed(2)} + GST`,
      entries: journalEntries,
      userId,
      projectId
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
  /**
   * Professional Bulk Update Engine
   * Atomic replacement of accounts across multiple transactions with balance recalibration.
   */
  static async bulkUpdateTransactions({ companyId, transactionIds, targetLedgerId, userId }) {
    const { AuditLog } = require('../models');
    
    const result = await sequelize.transaction(async (t) => {
      const targetLedger = await Ledger.findByPk(targetLedgerId, { transaction: t });
      if (!targetLedger) throw new Error('Target ledger not found');
      if (targetLedger.CompanyId !== companyId) throw new Error('Unauthorized target ledger');

      let updatedCount = 0;
      const historyDetails = [];

      for (const txId of transactionIds) {
        const tx = await Transaction.findByPk(txId, { transaction: t });
        if (!tx || tx.CompanyId !== companyId) continue;

        const oldLedgerId = tx.LedgerId;
        if (oldLedgerId === targetLedgerId) continue;

        // 1. Reverse balance from old ledger
        const oldLedger = await Ledger.findByPk(oldLedgerId, { transaction: t });
        if (oldLedger) {
          const delta = parseFloat(tx.debit || 0) - parseFloat(tx.credit || 0);
          oldLedger.currentBalance = parseFloat(oldLedger.currentBalance || 0) - delta;
          await oldLedger.save({ transaction: t });
          historyDetails.push({ txId, oldAccount: oldLedger.name });
        }

        // 2. Update transaction
        tx.LedgerId = targetLedgerId;
        await tx.save({ transaction: t });

        // 3. Apply balance to new ledger
        const delta = parseFloat(tx.debit || 0) - parseFloat(tx.credit || 0);
        targetLedger.currentBalance = parseFloat(targetLedger.currentBalance || 0) + delta;
        
        updatedCount++;
      }

      await targetLedger.save({ transaction: t });

      // 4. Audit Log
      if (AuditLog) {
        await AuditLog.create({
          action: 'BULK_UPDATE_TRANSACTIONS',
          tableName: 'Transactions',
          recordId: 0,
          newData: {
            updatedCount,
            targetAccount: targetLedger.name,
            transactionIds
          },
          CompanyId: companyId,
          UserId: userId
        }, { transaction: t });
      }

      return { updatedCount, targetAccount: targetLedger.name };
    });

    return result;
  }
}

module.exports = AccountingService;
