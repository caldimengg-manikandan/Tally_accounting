const { Voucher, Transaction, sequelize } = require('../models');
const { Op } = require('sequelize');

async function fix() {
  const t = await sequelize.transaction();
  try {
    // 1. Find all Payment vouchers
    const payments = await Voucher.findAll({
      where: { voucherType: 'Payment' },
      transaction: t
    });

    console.log(`Found ${payments.length} Payment vouchers.`);

    // Update their status to 'Paid' if it is null
    for (const payment of payments) {
      if (!payment.status) {
        await payment.update({ status: 'Paid' }, { transaction: t });
        console.log(`Updated Payment ${payment.voucherNumber} status to 'Paid'`);
      }
    }

    // 2. Find all Purchase vouchers (Bills)
    const bills = await Voucher.findAll({
      where: { voucherType: 'Purchase' },
      include: [{ model: Transaction }],
      transaction: t
    });

    console.log(`Found ${bills.length} Bill vouchers.`);

    for (const bill of bills) {
      // Find vendor credit transaction (= bill total)
      const creditTx = bill.Transactions?.find(tx => parseFloat(tx.credit || 0) > 0);
      const billTotal = creditTx ? parseFloat(creditTx.credit) : 0;

      // Find all payments referencing this bill where the payment status is 'Paid'
      const paymentsMade = await Transaction.findAll({
        where: {
          description: { [Op.like]: `%BILL_REF:${bill.id}%` }
        },
        include: [{
          model: Voucher,
          where: { status: 'Paid' }
        }],
        transaction: t
      });

      const totalPaid = paymentsMade.reduce((sum, p) => sum + parseFloat(p.debit || 0), 0);

      let status = 'OPEN';
      if (billTotal <= 0) {
        status = 'DRAFT';
      } else if (totalPaid >= billTotal - 0.01) {
        status = 'PAID';
      } else if (totalPaid > 0) {
        status = 'PARTIALLY_PAID';
      }

      await bill.update({ status }, { transaction: t });
      console.log(`Bill ${bill.voucherNumber} (Total: ${billTotal}, Paid: ${totalPaid}) -> Status updated to ${status}`);
    }

    await t.commit();
    console.log('Migration successfully completed!');
    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error('Error during migration:', err);
    process.exit(1);
  }
}

fix();
