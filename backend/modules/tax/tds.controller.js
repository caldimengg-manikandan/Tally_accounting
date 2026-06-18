const { TdsEntry, Ledger, Voucher, Company } = require('../../models');
const { Op } = require('sequelize');

exports.getForm26Q = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { quarter, fy } = req.query;

    const whereClause = { CompanyId: companyId };
    if (quarter) whereClause.quarter = quarter; // e.g. "Q1 FY2025-26"

    const entries = await TdsEntry.findAll({
      where: whereClause,
      include: [
        { model: Ledger, as: 'Vendor', attributes: ['name', 'pan', 'state', 'address'] },
        { model: Voucher, as: 'PaymentVoucher', attributes: ['voucherNumber', 'date'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Aggregate by Section and prepare entries for frontend
    const summaryBySection = {};
    let totalGross = 0;
    let totalTds = 0;

    const entriesList = entries.map(entry => {
      const section = entry.tdsSection || 'Unknown';
      const gross = parseFloat(entry.grossAmount) || 0;
      const tds = parseFloat(entry.tdsAmount) || 0;
      const pan = entry.pan || entry.Vendor?.pan || 'UNREGISTERED';

      if (!summaryBySection[section]) {
        summaryBySection[section] = { gross: 0, tds: 0 };
      }
      summaryBySection[section].gross += gross;
      summaryBySection[section].tds += tds;

      totalGross += gross;
      totalTds += tds;

      return {
        vendorName: entry.Vendor?.name || 'Unknown',
        pan: pan,
        tdsSection: section,
        quarter: entry.quarter || quarter || 'N/A',
        grossAmount: gross,
        tdsRate: parseFloat(entry.tdsRate) || 0,
        tdsAmount: tds
      };
    });

    res.json({
      totalGrossAmount: parseFloat(totalGross.toFixed(2)),
      totalTdsAmount: parseFloat(totalTds.toFixed(2)),
      generatedAt: new Date().toISOString(),
      summaryBySection: summaryBySection,
      entries: entriesList
    });

  } catch (err) {
    console.error('getForm26Q error:', err);
    res.status(500).json({ error: err.message });
  }
};
