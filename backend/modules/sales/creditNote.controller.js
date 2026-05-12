const { CreditNote, CreditNoteItem, Ledger, Item, sequelize } = require('../../models');

exports.createCreditNote = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { 
      companyId, customerLedgerId, accountsReceivableId, creditNoteNumber, referenceNumber, date, 
      salesperson, subject, subTotal, discount, 
      taxAmount, adjustment, totalAmount, status, items, projectId 
    } = req.body;

    const cn = await CreditNote.create({
      CompanyId: companyId,
      customerLedgerId,
      accountsReceivableId,
      creditNoteNumber,
      referenceNumber,
      date,
      salesperson,
      subject,
      subTotal,
      discount,
      taxAmount,
      adjustment,
      totalAmount,
      status: status || 'Draft',
      ProjectId: projectId
    }, { transaction: t });

    if (items && items.length > 0) {
      const validItems = items.filter(it => it.itemId && it.itemId !== '');
      const cnItems = validItems.map(it => ({
        itemId: it.itemId,
        accountId: it.accountId || null,
        description: it.description,
        quantity: parseFloat(it.quantity) || 0,
        rate: parseFloat(it.rate) || 0,
        amount: (parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0),
        CreditNoteId: cn.id
      }));
      if (cnItems.length > 0) {
        await CreditNoteItem.bulkCreate(cnItems, { transaction: t });
      }
    }

    await t.commit();
    res.status(201).json(cn);
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

exports.getCreditNotes = async (req, res) => {
  try {
    const { companyId } = req.params;
    const notes = await CreditNote.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: Ledger, as: 'Customer', attributes: ['name', 'currency'] }
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCreditNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const cn = await CreditNote.findByPk(id, {
      include: [
        { model: Ledger, as: 'Customer', attributes: ['name', 'email', 'currency'] },
        { model: Ledger, as: 'ARAccount', attributes: ['name'] },
        { model: CreditNoteItem, as: 'items', include: [
            { model: Item },
            { model: Ledger, as: 'Account', attributes: ['name'] }
        ]}
      ]
    });
    if (!cn) return res.status(404).json({ error: 'Credit Note not found' });
    res.json(cn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCreditNote = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { 
      customerLedgerId, accountsReceivableId, creditNoteNumber, referenceNumber, date, 
      salesperson, subject, subTotal, discount, 
      taxAmount, adjustment, totalAmount, status, items, projectId 
    } = req.body;

    const cn = await CreditNote.findByPk(id);
    if (!cn) return res.status(404).json({ error: 'Credit Note not found' });

    await cn.update({
      customerLedgerId,
      accountsReceivableId,
      creditNoteNumber,
      referenceNumber,
      date,
      salesperson,
      subject,
      subTotal,
      discount,
      taxAmount,
      adjustment,
      totalAmount,
      status,
      ProjectId: projectId
    }, { transaction: t });

    if (items) {
      await CreditNoteItem.destroy({ where: { CreditNoteId: id }, transaction: t });
      const validItems = items.filter(it => it.itemId && it.itemId !== '');
      const cnItems = validItems.map(it => ({
        itemId: it.itemId,
        accountId: it.accountId || null,
        description: it.description,
        quantity: parseFloat(it.quantity) || 0,
        rate: parseFloat(it.rate) || 0,
        amount: (parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0),
        CreditNoteId: id
      }));
      if (cnItems.length > 0) {
        await CreditNoteItem.bulkCreate(cnItems, { transaction: t });
      }
    }

    await t.commit();
    res.json(cn);
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCreditNote = async (req, res) => {
  try {
    const { id } = req.params;
    await CreditNote.destroy({ where: { id } });
    res.json({ message: 'Credit Note deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
