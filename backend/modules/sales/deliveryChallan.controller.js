const { DeliveryChallan, DeliveryChallanItem, Ledger, Item, sequelize } = require('../../models');

exports.createChallan = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { 
      companyId, customerLedgerId, challanNumber, referenceNumber, date, 
      challanType, salesperson, subject, subTotal, discount, 
      taxAmount, adjustment, totalAmount, status, items 
    } = req.body;

    const challan = await DeliveryChallan.create({
      CompanyId: companyId,
      customerLedgerId,
      challanNumber,
      referenceNumber,
      date,
      challanType,
      salesperson,
      subject,
      subTotal,
      discount,
      taxAmount,
      adjustment,
      totalAmount,
      status: status || 'Draft'
    }, { transaction: t });

    if (items && items.length > 0) {
      const validItems = items.filter(it => it.itemId && it.itemId !== '');
      const challanItems = validItems.map(it => ({
        itemId: it.itemId,
        description: it.description,
        quantity: parseFloat(it.quantity) || 0,
        rate: parseFloat(it.rate) || 0,
        amount: (parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0),
        DeliveryChallanId: challan.id
      }));
      if (challanItems.length > 0) {
        await DeliveryChallanItem.bulkCreate(challanItems, { transaction: t });
      }
    }

    await t.commit();
    res.status(201).json(challan);
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

exports.getChallans = async (req, res) => {
  try {
    const { companyId } = req.params;
    const challans = await DeliveryChallan.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: Ledger, as: 'Customer', attributes: ['name'] }
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(challans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getChallanById = async (req, res) => {
  try {
    const { id } = req.params;
    const challan = await DeliveryChallan.findByPk(id, {
      include: [
        { model: Ledger, as: 'Customer', attributes: ['name', 'email'] },
        { model: DeliveryChallanItem, as: 'items', include: [{ model: Item }] }
      ]
    });
    if (!challan) return res.status(404).json({ error: 'Challan not found' });
    res.json(challan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateChallan = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { 
      customerLedgerId, challanNumber, referenceNumber, date, 
      challanType, salesperson, subject, subTotal, discount, 
      taxAmount, adjustment, totalAmount, status, items 
    } = req.body;

    const challan = await DeliveryChallan.findByPk(id);
    if (!challan) return res.status(404).json({ error: 'Challan not found' });

    await challan.update({
      customerLedgerId,
      challanNumber,
      referenceNumber,
      date,
      challanType,
      salesperson,
      subject,
      subTotal,
      discount,
      taxAmount,
      adjustment,
      totalAmount,
      status
    }, { transaction: t });

    if (items) {
      await DeliveryChallanItem.destroy({ where: { DeliveryChallanId: id }, transaction: t });
      const validItems = items.filter(it => it.itemId && it.itemId !== '');
      const challanItems = validItems.map(it => ({
        itemId: it.itemId,
        description: it.description,
        quantity: parseFloat(it.quantity) || 0,
        rate: parseFloat(it.rate) || 0,
        amount: (parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0),
        DeliveryChallanId: id
      }));
      if (challanItems.length > 0) {
        await DeliveryChallanItem.bulkCreate(challanItems, { transaction: t });
      }
    }

    await t.commit();
    res.json(challan);
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

exports.deleteChallan = async (req, res) => {
  try {
    const { id } = req.params;
    await DeliveryChallan.destroy({ where: { id } });
    res.json({ message: 'Delivery Challan deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
