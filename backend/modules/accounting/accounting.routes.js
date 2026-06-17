const express = require('express');
const router = express.Router();
const accountingService = require('./accounting.service');
const { verifyToken, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

router.post('/calculate-gst', async (req, res, next) => {
  try {
    const { amount, rate, ledgerId, companyId } = req.body;
    const { Company, Ledger } = require('../../models');
    
    const company = await Company.findByPk(companyId);
    const ledger = await Ledger.findByPk(ledgerId);

    if (!company || !ledger) {
      return res.status(404).json({ error: 'Company or Ledger not found for GST calculation.' });
    }

    const isInterstate = company.state !== ledger.state;
    const result = accountingService.calculateProfessionalGST(amount, rate, isInterstate);
    
    res.json({ ...result, isInterstate, companyState: company.state, ledgerState: ledger.state });
  } catch (err) {
    next(err);
  }
});

router.post('/scan-receipt', async (req, res) => {
  const result = await accountingService.simulateAIOCR(req.body.fileName);
  res.json(result);
});

module.exports = router;
