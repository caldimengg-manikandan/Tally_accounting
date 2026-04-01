const { Transaction, Voucher } = require('./models');

async function fixGhost() {
  try {
    const voucherNumber = 'JOU-2026-0002';
    const voucher = await Voucher.findOne({ where: { voucherNumber } });
    if (voucher) {
      await Transaction.destroy({ where: { VoucherId: voucher.id } });
      await Voucher.destroy({ where: { id: voucher.id } });
      console.log('Fixed ghost transaction JOU-2026-0002');
    }
  } catch(e) { console.error(e); }
  process.exit(0);
}
fixGhost();
