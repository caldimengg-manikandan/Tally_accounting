const { 
  Project, ProjectTask, ProjectUser, User, Ledger, 
  Voucher, Transaction, SalesInvoice, PurchaseOrder, VendorCredit, AuditLog, Timesheet 
} = require('../../models');
const { Op } = require('sequelize');

exports.createProject = async (req, res) => {
  try {
    const { 
      name, projectCode, description, billingMethod, budgetType, budgetAmount, 
      costBudget, revenueBudget, addToWatchlist,
      ratePerHour, customerLedgerId, CompanyId, tasks, users, startDate, endDate 
    } = req.body;

    const project = await Project.create({
      name, projectCode, description, billingMethod, budgetType, budgetAmount,
      costBudget, revenueBudget, addToWatchlist,
      ratePerHour, customerLedgerId, CompanyId, startDate, endDate
    });

    if (tasks && tasks.length > 0) {
      await Promise.all(tasks.map(t => ProjectTask.create({ ...t, ProjectId: project.id })));
    }

    if (users && users.length > 0) {
      await Promise.all(users.map(u => ProjectUser.create({ ...u, ProjectId: project.id })));
    }

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProjectsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log('--- Fetching projects for company:', companyId);
    if (!companyId || companyId === 'null' || companyId === 'undefined') {
      return res.status(400).json({ error: 'Valid Company ID is required' });
    }

    const projects = await Project.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: Ledger, as: 'Customer' },
        { model: ProjectTask, as: 'tasks' },
        { model: ProjectUser, as: 'ProjectUsers', include: [User] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, CompanyId: req.companyId },
      include: [
        { model: Ledger, as: 'Customer' },
        { model: ProjectTask, as: 'tasks' },
        { model: ProjectUser, as: 'ProjectUsers', include: [User] }
      ]
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { tasks, users, ...projectData } = req.body;
    const project = await Project.findOne({ where: { id: req.params.id, CompanyId: req.companyId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await project.update(projectData);

    if (tasks) {
      await ProjectTask.destroy({ where: { ProjectId: project.id } });
      if (tasks.length > 0) {
        await Promise.all(tasks.map(t => ProjectTask.create({ ...t, ProjectId: project.id })));
      }
    }

    if (users) {
      await ProjectUser.destroy({ where: { ProjectId: project.id } });
      if (users.length > 0) {
        await Promise.all(users.map(u => ProjectUser.create({ ...u, ProjectId: project.id })));
      }
    }
    
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne({ where: { id: req.params.id, CompanyId: req.companyId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await project.destroy();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProjectPurchases = async (req, res) => {
  try {
    const { id } = req.params;
    // Bills (VoucherType 'Purchase') and Expenses (VoucherType 'Payment')
    const vouchers = await Voucher.findAll({
      where: { ProjectId: id, CompanyId: req.companyId },
      include: [
        { 
          model: Transaction, 
          include: [{ model: Ledger, attributes: ['id', 'name'] }] 
        }
      ],
      order: [['date', 'DESC']]
    });

    // Purchase Orders
    const orders = await PurchaseOrder.findAll({
      where: { ProjectId: id, CompanyId: req.companyId },
      include: [{ model: Ledger, attributes: ['id', 'name'] }],
      order: [['date', 'DESC']]
    });

    // Vendor Credits
    const credits = await VendorCredit.findAll({
      where: { ProjectId: id, CompanyId: req.companyId },
      include: [{ model: Ledger, as: 'Vendor', attributes: ['id', 'name'] }],
      order: [['date', 'DESC']]
    });

    // Timesheets
    const timesheets = await Timesheet.findAll({
      where: { ProjectId: id, CompanyId: req.companyId },
      include: [
        { model: User, attributes: ['name'] },
        { model: ProjectTask, attributes: ['name'] }
      ],
      order: [['date', 'DESC']]
    });

    res.json({ 
      bills: vouchers.filter(v => v.voucherType === 'Purchase'), 
      expenses: vouchers.filter(v => v.voucherType === 'Payment'), 
      orders, 
      credits,
      timesheets
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProjectSales = async (req, res) => {
  try {
    const { id } = req.params;
    const { SalesOrder, Quote, DeliveryChallan, CreditNote } = require('../../models');

    const invoices = await SalesInvoice.findAll({
      where: { ProjectId: id, CompanyId: req.companyId },
      include: [{ model: Ledger, as: 'CustomerLedger', attributes: ['id', 'name'] }],
      order: [['date', 'DESC']]
    });

    const orders = await SalesOrder.findAll({
      where: { ProjectId: id, CompanyId: req.companyId },
      include: [{ model: Ledger, as: 'Customer', attributes: ['id', 'name'] }],
      order: [['date', 'DESC']]
    });

    const quotes = await Quote.findAll({
      where: { ProjectId: id, CompanyId: req.companyId },
      include: [{ model: Ledger, as: 'Customer', attributes: ['id', 'name'] }],
      order: [['date', 'DESC']]
    });

    const challans = await DeliveryChallan.findAll({
      where: { ProjectId: id, CompanyId: req.companyId },
      include: [{ model: Ledger, as: 'Customer', attributes: ['id', 'name'] }],
      order: [['date', 'DESC']]
    });

    const creditNotes = await CreditNote.findAll({
      where: { ProjectId: id, CompanyId: req.companyId },
      include: [{ model: Ledger, as: 'Customer', attributes: ['id', 'name'] }],
      order: [['date', 'DESC']]
    });

    res.json({ invoices, orders, quotes, challans, creditNotes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProjectActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await AuditLog.findAll({
      where: { ProjectId: id, CompanyId: req.companyId },
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
