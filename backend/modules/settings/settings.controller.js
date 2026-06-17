const { FinancialPeriod, AuditLog } = require('../../models');

exports.createFinancialPeriod = async (req, res, next) => {
  try {
    const { periodName, startDate, endDate } = req.body;
    const companyId = req.companyId;

    const period = await FinancialPeriod.create({
      periodName, startDate, endDate, CompanyId: companyId
    });

    if (AuditLog) {
      await AuditLog.create({
        action: 'CREATE_FINANCIAL_PERIOD',
        tableName: 'FinancialPeriods',
        recordId: period.id,
        newData: { periodName, startDate, endDate },
        CompanyId: companyId,
        UserId: req.user.id
      });
    }

    res.status(201).json(period);
  } catch (err) {
    next(err);
  }
};

exports.getFinancialPeriods = async (req, res, next) => {
  try {
    const periods = await FinancialPeriod.findAll({ where: { CompanyId: req.companyId } });
    res.json(periods);
  } catch (err) {
    next(err);
  }
};

exports.togglePeriodLock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isLocked } = req.body;
    const period = await FinancialPeriod.findOne({ where: { id, CompanyId: req.companyId } });

    if (!period) return res.status(404).json({ error: 'Financial period not found' });

    period.isLocked = isLocked;
    if (isLocked) {
      period.lockedBy = req.user.id;
      period.lockedAt = new Date();
    } else {
      period.unlockedBy = req.user.id;
      period.unlockedAt = new Date();
    }
    await period.save();

    if (AuditLog) {
      await AuditLog.create({
        action: isLocked ? 'LOCK_FINANCIAL_PERIOD' : 'UNLOCK_FINANCIAL_PERIOD',
        tableName: 'FinancialPeriods',
        recordId: period.id,
        newData: { isLocked },
        CompanyId: req.companyId,
        UserId: req.user.id
      });
    }

    res.json(period);
  } catch (err) {
    next(err);
  }
};
