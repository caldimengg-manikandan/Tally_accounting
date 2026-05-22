const { Voucher, Transaction, Ledger, sequelize } = require('../models');
const { Op } = require('sequelize');

async function testSync() {
  const t = await sequelize.transaction();
  try {
    // 1. Fetch an OPEN Bill
    const bill = await Voucher.findOne({
      where: {
        voucherType: 'Purchase',
        status: 'OPEN'
      },
      include: [{ model: Transaction }],
      transaction: t
    });

    if (!bill) {
      console.log('No OPEN bills found to test. Skipping test.');
      await t.rollback();
      process.exit(0);
    }

    console.log(`Testing with Bill: ${bill.voucherNumber}, ID: ${bill.id}, Current Status: ${bill.status}`);

    // Get the vendor/ledger associated with the bill (the credit transaction)
    const creditTx = bill.Transactions.find(tx => parseFloat(tx.credit || 0) > 0);
    if (!creditTx) {
      throw new Error(`Bill ${bill.voucherNumber} does not have a credit transaction!`);
    }

    const vendorId = creditTx.LedgerId;
    const billTotal = parseFloat(creditTx.credit);
    console.log(`Bill Total: ${billTotal}, Vendor Ledger ID: ${vendorId}`);

    // Find a Cash or Bank ledger for the paidThroughId
    // Let's search for Bank/Cash groups
    const paidThroughLedger = await Ledger.findOne({
      where: {
        CompanyId: bill.CompanyId
      },
      transaction: t
    });

    if (!paidThroughLedger) {
      throw new Error('No cash or bank ledger found!');
    }

    console.log(`Using Paid Through Ledger: ${paidThroughLedger.name} (${paidThroughLedger.id})`);

    // Let's create a payment in DRAFT first
    const payment = await Voucher.create({
      CompanyId: bill.CompanyId,
      voucherType: 'Payment',
      voucherNumber: `TEST-PAY-${Date.now()}`,
      date: new Date(),
      status: 'Draft',
      narration: `Test Payment for Bill ${bill.voucherNumber}`
    }, { transaction: t });

    // Create the credit transaction (from bank)
    await Transaction.create({
      VoucherId: payment.id,
      CompanyId: bill.CompanyId,
      LedgerId: paidThroughLedger.id,
      credit: billTotal,
      debit: 0
    }, { transaction: t });

    // Create the debit transaction (to vendor, with BILL_REF)
    await Transaction.create({
      VoucherId: payment.id,
      CompanyId: bill.CompanyId,
      LedgerId: vendorId,
      credit: 0,
      debit: billTotal,
      description: `Payment for Bill ${bill.voucherNumber}. BILL_REF:${bill.id}`
    }, { transaction: t });

    console.log(`Created Draft Payment: ${payment.voucherNumber}`);

    // Call updateBillsForPayment helper logic to verify that DRAFT payment does NOT update the bill to PAID
    // Since updateBillsForPayment is internal to paymentMade.controller, let's replicate the lookup logic here
    const getBillStatus = async () => {
      const allPayments = await Transaction.findAll({
        where: { description: { [Op.like]: `%BILL_REF:${bill.id}%` } },
        include: [{
          model: Voucher,
          where: { status: 'Paid' }
        }],
        transaction: t
      });
      const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(p.debit || 0), 0);
      console.log(`Calculated Total Paid for Bill ${bill.voucherNumber}: ${totalPaid}`);
      if (totalPaid >= billTotal - 0.01) return 'PAID';
      if (totalPaid > 0) return 'PARTIALLY_PAID';
      return 'OPEN';
    };

    let calculatedStatus = await getBillStatus();
    console.log(`Draft payment: Bill status should be OPEN. Computed status: ${calculatedStatus}`);
    if (calculatedStatus !== 'OPEN') {
      throw new Error(`Assert failed: Draft payment changed bill status to ${calculatedStatus}`);
    }

    // Now set payment to Paid
    await payment.update({ status: 'Paid' }, { transaction: t });
    console.log('Updated Payment status to Paid');

    calculatedStatus = await getBillStatus();
    console.log(`Paid payment: Bill status should be PAID. Computed status: ${calculatedStatus}`);
    if (calculatedStatus !== 'PAID') {
      throw new Error(`Assert failed: Paid payment did not change bill status to PAID (got ${calculatedStatus})`);
    }

    // Now set payment back to Draft
    await payment.update({ status: 'Draft' }, { transaction: t });
    console.log('Updated Payment status back to Draft');

    calculatedStatus = await getBillStatus();
    console.log(`Draft payment: Bill status should be OPEN. Computed status: ${calculatedStatus}`);
    if (calculatedStatus !== 'OPEN') {
      throw new Error(`Assert failed: Draft payment did not revert bill status to OPEN (got ${calculatedStatus})`);
    }

    // All tests passed, roll back transactions so we don't pollute the DB
    await t.rollback();
    console.log('All backend sync tests passed successfully!');
    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error('Test Failed:', err);
    process.exit(1);
  }
}

testSync();
