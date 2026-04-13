const { PurchaseOrder, Ledger, Group, sequelize, Voucher, Transaction } = require('../../models');
const { Op } = require('sequelize');

exports.getVendors = async (req, res) => {
  try {
    const { companyId } = req.params;
    // Find the Sundry Creditors group
    const creditorGroup = await Group.findOne({
      where: { 
        CompanyId: companyId,
        name: 'Sundry Creditors'
      }
    });

    if (!creditorGroup) {
      return res.json([]);
    }

    const vendors = await Ledger.findAll({
      where: { 
        CompanyId: companyId,
        GroupId: creditorGroup.id
      },
      order: [['name', 'ASC']]
    });
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { companyId } = req.params;
    const orders = await PurchaseOrder.findAll({
      where: { CompanyId: companyId },
      include: [{ model: Ledger, attributes: ['name'] }],
      order: [['date', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { orderNumber, date, totalAmount, status, notes, supplierLedgerId, companyId } = req.body;
    const order = await PurchaseOrder.create({
      orderNumber,
      date,
      totalAmount,
      status,
      notes,
      LedgerId: supplierLedgerId,
      CompanyId: companyId
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await PurchaseOrder.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    await order.update(req.body);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await PurchaseOrder.destroy({ where: { id } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Placeholder for Bills (Purchase Vouchers)
exports.getBills = async (req, res) => {
    try {
        const { companyId } = req.params;
        const bills = await Voucher.findAll({
            where: { 
                CompanyId: companyId,
                voucherType: 'Purchase'
            },
            order: [['date', 'DESC']]
        });
        res.json(bills);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Placeholder for Expenses (Payment Vouchers - simple version)
exports.getExpenses = async (req, res) => {
    try {
        const { companyId } = req.params;
        const expenses = await Voucher.findAll({
            where: { 
                CompanyId: companyId,
                voucherType: 'Payment'
            },
            include: [{
                model: Transaction,
                include: [{ model: Ledger, attributes: ['id', 'name'] }]
            }],
            order: [['date', 'DESC'], ['createdAt', 'DESC']]
        });
        
        const mappedExpenses = expenses.map(expense => {
            const totalAmount = expense.Transactions?.reduce((sum, t) => {
                return t.type === 'Dr' ? sum + parseFloat(t.amount || 0) : sum;
            }, 0) || 0;
            
            const expenseTransaction = expense.Transactions?.find(t => t.type === 'Dr');
            
            let customerName = '-';
            let vendorName = '-';
            try {
                if (expense.narration) {
                    const parsed = JSON.parse(expense.narration);
                    if (parsed.vendor) vendorName = parsed.vendor;
                    if (parsed.customer) customerName = parsed.customer;
                }
            } catch (e) {}

            // Find the Credit transaction for 'Paid Through'
            const paymentTransaction = expense.Transactions?.find(t => t.type === 'Cr');
            const paidThrough = paymentTransaction?.Ledger?.name || 'Cash';

            return {
                id: expense.id,
                date: expense.date,
                voucherNumber: expense.voucherNumber,
                totalAmount,
                Ledger: expenseTransaction ? expenseTransaction.Ledger : null,
                vendorName,
                customerName,
                paidThrough,
                narration: expense.narration
            };
        });

        res.json(mappedExpenses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
