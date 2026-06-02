const { Currency, AuditLog } = require('../../models');

exports.createCurrency = async (req, res) => {
  try {
    const { code, name, symbol, exchangeRate, companyId } = req.body;
    const currency = await Currency.create({
      code,
      name,
      symbol,
      exchangeRate: parseFloat(exchangeRate || 1.00),
      CompanyId: companyId
    });

    await AuditLog.create({
      action: 'CREATE_CURRENCY',
      tableName: 'Currencies',
      recordId: currency.id,
      newData: currency,
      CompanyId: companyId,
      UserId: req.user?.id
    });

    res.status(201).json(currency);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCurrencies = async (req, res) => {
  try {
    const { companyId } = req.params;
    const currencies = await Currency.findAll({ where: { CompanyId: companyId } });
    res.json(currencies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCurrency = async (req, res) => {
  try {
    const { id } = req.params;
    const { exchangeRate } = req.body;
    const currency = await Currency.findByPk(id);
    if (!currency) return res.status(404).json({ error: 'Currency not found' });

    currency.exchangeRate = parseFloat(exchangeRate);
    await currency.save();

    await AuditLog.create({
      action: 'UPDATE_CURRENCY',
      tableName: 'Currencies',
      recordId: currency.id,
      newData: currency,
      CompanyId: currency.CompanyId,
      UserId: req.user?.id
    });

    res.json(currency);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCurrency = async (req, res) => {
  try {
    const { id } = req.params;
    const currency = await Currency.findByPk(id);
    if (!currency) return res.status(404).json({ error: 'Currency not found' });

    await currency.destroy();
    res.json({ message: 'Currency deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
