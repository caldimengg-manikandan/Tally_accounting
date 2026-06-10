const sequelize = require('../config/db.config');
const { DataTypes } = require('sequelize');

const User = require('./user.model')(sequelize, DataTypes);
const Company = require('./company.model')(sequelize, DataTypes);
const Group = require('./group.model')(sequelize, DataTypes);
const Ledger = require('./ledger.model')(sequelize, DataTypes);
const Voucher = require('./voucher.model')(sequelize, DataTypes);
const Transaction = require('./transaction.model')(sequelize, DataTypes);
const Item = require('./item.model')(sequelize, DataTypes);
const BankTransaction = require('./bankTransaction.model')(sequelize, DataTypes);
const CostCenter = require('./costCenter.model')(sequelize, DataTypes);
const SalesOrder = require('./salesOrder.model')(sequelize, DataTypes);
const SalesOrderItem = require('./salesOrderItem.model')(sequelize, DataTypes);
const PurchaseOrder = require('./purchaseOrder.model')(sequelize, DataTypes);
const PriceList = require('./pricelist.model')(sequelize, DataTypes);
const AuditLog = require('./audit.model')(sequelize, DataTypes);
const Quote = require('./quote.model')(sequelize, DataTypes);
const RetainerInvoice = require('./retainerInvoice.model')(sequelize, DataTypes);
const RecurringInvoice = require('./recurringInvoice.model')(sequelize, DataTypes);
const RetainerAdjustment = require('./retainerAdjustment.model')(sequelize, DataTypes);
const SalesInvoice = require('./salesInvoice.model')(sequelize, DataTypes);
const SalesInvoiceItem = require('./salesInvoiceItem.model')(sequelize, DataTypes);
const SystemMail = require('./systemMail.model')(sequelize, DataTypes);
const CreditNote = require('./creditNote.model')(sequelize, DataTypes);
const CreditNoteItem = require('./creditNoteItem.model')(sequelize, DataTypes);
const DeliveryChallan = require('./deliveryChallan.model')(sequelize, DataTypes);
const DeliveryChallanItem = require('./deliveryChallanItem.model')(sequelize, DataTypes);
const Project = require('./project.model')(sequelize, DataTypes);
const ProjectTask = require('./projectTask.model')(sequelize, DataTypes);
const ProjectUser = require('./projectUser.model')(sequelize, DataTypes);
const RecurringExpense = require('./recurringExpense.model')(sequelize, DataTypes);
const RecurringBill = require('./recurringBill.model')(sequelize, DataTypes);
const RecurringBillItem = require('./recurringBillItem.model')(sequelize, DataTypes);
const VendorCredit = require('./vendorCredit.model')(sequelize, DataTypes);
const VendorCreditItem = require('./vendorCreditItem.model')(sequelize, DataTypes);
const Timesheet = require('./timesheet.model')(sequelize, DataTypes);
const StockGroup = require('./stockGroup.model')(sequelize, DataTypes);
const StockCategory = require('./stockCategory.model')(sequelize, DataTypes);
const UnitOfMeasure = require('./unitOfMeasure.model')(sequelize, DataTypes);
const Godown = require('./godown.model')(sequelize, DataTypes);
const Currency = require('./currency.model')(sequelize, DataTypes);
const CostCategory = require('./costCategory.model')(sequelize, DataTypes);
const Employee = require('./employee.model')(sequelize, DataTypes);
const Attendance = require('./attendance.model')(sequelize, DataTypes);
const SalaryStructure = require('./salaryStructure.model')(sequelize, DataTypes);
const Payslip = require('./payslip.model')(sequelize, DataTypes);
const FixedAsset = require('./fixedAsset.model')(sequelize, DataTypes);
const DepreciationLog = require('./depreciationLog.model')(sequelize, DataTypes);
const BOM = require('./bom.model')(sequelize, DataTypes);
const BOMItem = require('./bomItem.model')(sequelize, DataTypes);
const ProductionOrder = require('./productionOrder.model')(sequelize, DataTypes);
const Budget = require('./budget.model')(sequelize, DataTypes);
const BudgetItem = require('./budgetItem.model')(sequelize, DataTypes);
const CostCenterAllocation = require('./costCenterAllocation.model')(sequelize, DataTypes);

// ─── Associations ────────────────────────────────────────────────────────────

// 1. User & Company (Multi-tenancy)
// junction table for multi-company access
User.belongsToMany(Company, { 
  through: 'UserCompanies',
  foreignKey: { name: 'userId', type: DataTypes.UUID },
  otherKey: { name: 'companyId', type: DataTypes.UUID }
});
Company.belongsToMany(User, { 
  through: 'UserCompanies',
  foreignKey: { name: 'companyId', type: DataTypes.UUID },
  otherKey: { name: 'userId', type: DataTypes.UUID }
});

Company.belongsTo(User, { as: 'Owner', foreignKey: { name: 'userId', type: DataTypes.UUID } });
User.hasMany(Company, { as: 'OwnedCompanies', foreignKey: { name: 'userId', type: DataTypes.UUID } });

// 2. Structural Hierarchy
Company.hasMany(Group, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
Group.belongsTo(Company, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });

// Self-referential groups (Tally standard)
Group.hasMany(Group, { as: 'SubGroups', foreignKey: { name: 'parent_id', type: DataTypes.UUID }, onDelete: 'SET NULL' });
Group.belongsTo(Group, { as: 'ParentGroup', foreignKey: { name: 'parent_id', type: DataTypes.UUID }, onDelete: 'SET NULL' });

Group.hasMany(Ledger, { foreignKey: { name: 'GroupId', type: DataTypes.UUID } });
Ledger.belongsTo(Group, { foreignKey: { name: 'GroupId', type: DataTypes.UUID } });

Company.hasMany(Ledger, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
Ledger.belongsTo(Company, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });

Company.hasMany(CostCenter, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
CostCenter.belongsTo(Company, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });

// 3. Transactions & Vouchers
Company.hasMany(Voucher, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
Voucher.belongsTo(Company, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });

Voucher.hasMany(Transaction, { foreignKey: { name: 'VoucherId', type: DataTypes.UUID }, onDelete: 'CASCADE' });
Transaction.belongsTo(Voucher, { foreignKey: { name: 'VoucherId', type: DataTypes.UUID } });

Ledger.hasMany(Transaction, { foreignKey: { name: 'LedgerId', type: DataTypes.UUID } });
Transaction.belongsTo(Ledger, { foreignKey: { name: 'LedgerId', type: DataTypes.UUID } });

CostCenter.hasMany(Transaction, { foreignKey: { name: 'CostCenterId', type: DataTypes.UUID } });
Transaction.belongsTo(CostCenter, { foreignKey: { name: 'CostCenterId', type: DataTypes.UUID } });

// 4. Inventory & Logic
Company.hasMany(Item, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
Item.belongsTo(Company, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });

Item.hasMany(Transaction, { foreignKey: { name: 'ItemId', type: DataTypes.UUID } });
Transaction.belongsTo(Item, { foreignKey: { name: 'ItemId', type: DataTypes.UUID } });

// 5. Orders & Reconciliation
Company.hasMany(SalesOrder, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
SalesOrder.belongsTo(Company, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });

SalesOrder.belongsTo(Ledger, { as: 'Customer', foreignKey: { name: 'LedgerId', type: DataTypes.UUID } });
Ledger.hasMany(SalesOrder, { foreignKey: { name: 'LedgerId', type: DataTypes.UUID } });

SalesOrder.hasMany(SalesOrderItem, { as: 'Items', foreignKey: { name: 'SalesOrderId', type: DataTypes.UUID }, onDelete: 'CASCADE' });
SalesOrderItem.belongsTo(SalesOrder, { foreignKey: { name: 'SalesOrderId', type: DataTypes.UUID } });

SalesOrderItem.belongsTo(Item, { foreignKey: { name: 'ItemId', type: DataTypes.UUID } });
Item.hasMany(SalesOrderItem, { foreignKey: { name: 'ItemId', type: DataTypes.UUID } });

Company.hasMany(PurchaseOrder, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
PurchaseOrder.belongsTo(Company, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
PurchaseOrder.belongsTo(Ledger, { foreignKey: { name: 'LedgerId', type: DataTypes.UUID } });
Ledger.hasMany(PurchaseOrder, { foreignKey: { name: 'LedgerId', type: DataTypes.UUID } });

Company.hasMany(BankTransaction, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
BankTransaction.belongsTo(Company, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });

Company.hasMany(PriceList, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
PriceList.belongsTo(Company, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });

// 6. Audit & Metadata
Company.hasMany(AuditLog, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
AuditLog.belongsTo(Company, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });

// 7. Quotes
Company.hasMany(Quote, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
Quote.belongsTo(Company, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
Quote.belongsTo(Ledger, { as: 'Customer', foreignKey: 'customerLedgerId' });
Ledger.hasMany(Quote, { foreignKey: 'customerLedgerId' });

// 8. Retainer Invoices
Company.hasMany(RetainerInvoice, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
RetainerInvoice.belongsTo(Company, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
RetainerInvoice.belongsTo(Ledger, { as: 'CustomerLedger', foreignKey: 'customerLedgerId' });
Ledger.hasMany(RetainerInvoice, { foreignKey: 'customerLedgerId' });

// 9. Recurring Invoices
Company.hasMany(RecurringInvoice, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
RecurringInvoice.belongsTo(Company, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });

// 10. Recurring Expenses
Company.hasMany(RecurringExpense, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
RecurringExpense.belongsTo(Company, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });

RecurringExpense.belongsTo(Ledger, { as: 'ExpenseAccount', foreignKey: 'expenseAccountId' });
RecurringExpense.belongsTo(Ledger, { as: 'PaidThrough', foreignKey: 'paidThroughId' });
RecurringExpense.belongsTo(Ledger, { as: 'Vendor', foreignKey: 'vendorId' });
RecurringExpense.belongsTo(Ledger, { as: 'Customer', foreignKey: 'customerId' });

// 11. Recurring Bills
Company.hasMany(RecurringBill, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
RecurringBill.belongsTo(Company, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });

RecurringBill.hasMany(RecurringBillItem, { as: 'items', foreignKey: 'RecurringBillId', onDelete: 'CASCADE' });
RecurringBillItem.belongsTo(RecurringBill, { foreignKey: 'RecurringBillId' });

RecurringBill.belongsTo(Ledger, { as: 'Vendor', foreignKey: 'vendorId' });
Ledger.hasMany(RecurringBill, { foreignKey: 'vendorId' });

// 10. Retainer Adjustments
Company.hasMany(RetainerAdjustment, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
RetainerAdjustment.belongsTo(Company, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });

RetainerInvoice.hasMany(RetainerAdjustment, { foreignKey: { name: 'RetainerInvoiceId', type: DataTypes.UUID } });
RetainerAdjustment.belongsTo(RetainerInvoice, { foreignKey: { name: 'RetainerInvoiceId', type: DataTypes.UUID } });

User.hasMany(AuditLog, { foreignKey: { name: 'UserId', type: DataTypes.UUID } });
AuditLog.belongsTo(User, { foreignKey: { name: 'UserId', type: DataTypes.UUID } });

User.hasMany(Transaction, { foreignKey: { name: 'CreatedBy', type: DataTypes.UUID } });
Transaction.belongsTo(User, { as: 'Creator', foreignKey: { name: 'CreatedBy', type: DataTypes.UUID } });

Transaction.belongsTo(Company, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
Company.hasMany(Transaction, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });

// 11. Sales Invoices
SalesInvoice.hasMany(SalesInvoiceItem, { as: 'items', foreignKey: 'SalesInvoiceId', onDelete: 'CASCADE' });
SalesInvoiceItem.belongsTo(SalesInvoice, { foreignKey: 'SalesInvoiceId' });
SalesInvoice.belongsTo(Company, { foreignKey: 'CompanyId' });
Company.hasMany(SalesInvoice, { foreignKey: 'CompanyId' });
SalesInvoice.belongsTo(Ledger, { as: 'CustomerLedger', foreignKey: 'customerLedgerId' });
SalesInvoiceItem.belongsTo(Item, { foreignKey: 'itemId' });

// 12. System Mails
Company.hasMany(SystemMail, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });
SystemMail.belongsTo(Company, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });

Ledger.hasMany(SystemMail, { foreignKey: { name: 'LedgerId', type: DataTypes.UUID } });
SystemMail.belongsTo(Ledger, { foreignKey: { name: 'LedgerId', type: DataTypes.UUID } });

User.hasMany(SystemMail, { foreignKey: { name: 'SenderId', type: DataTypes.UUID } });
SystemMail.belongsTo(User, { as: 'Sender', foreignKey: { name: 'SenderId', type: DataTypes.UUID } });

// 13. Credit Notes
CreditNote.hasMany(CreditNoteItem, { as: 'items', foreignKey: 'CreditNoteId', onDelete: 'CASCADE' });
CreditNoteItem.belongsTo(CreditNote, { foreignKey: 'CreditNoteId' });
CreditNote.belongsTo(Company, { foreignKey: 'CompanyId' });
Company.hasMany(CreditNote, { foreignKey: 'CompanyId' });
CreditNote.belongsTo(Ledger, { as: 'Customer', foreignKey: 'customerLedgerId' });
CreditNote.belongsTo(Ledger, { as: 'ARAccount', foreignKey: 'accountsReceivableId' });
CreditNoteItem.belongsTo(Item, { foreignKey: 'itemId' });
CreditNoteItem.belongsTo(Ledger, { as: 'Account', foreignKey: 'accountId' });

// 14. Delivery Challans
DeliveryChallan.hasMany(DeliveryChallanItem, { as: 'items', foreignKey: 'DeliveryChallanId', onDelete: 'CASCADE' });
DeliveryChallanItem.belongsTo(DeliveryChallan, { foreignKey: 'DeliveryChallanId' });
DeliveryChallan.belongsTo(Company, { foreignKey: 'CompanyId' });
Company.hasMany(DeliveryChallan, { foreignKey: 'CompanyId' });
DeliveryChallan.belongsTo(Ledger, { as: 'Customer', foreignKey: 'customerLedgerId' });
DeliveryChallanItem.belongsTo(Item, { foreignKey: 'itemId' });

// 15. Projects & Time Tracking
Company.hasMany(Project, { foreignKey: 'CompanyId' });
Project.belongsTo(Company, { foreignKey: 'CompanyId' });

Project.belongsTo(Ledger, { as: 'Customer', foreignKey: 'customerLedgerId' });
Ledger.hasMany(Project, { foreignKey: 'customerLedgerId' });

Project.hasMany(ProjectTask, { as: 'tasks', foreignKey: 'ProjectId', onDelete: 'CASCADE' });
ProjectTask.belongsTo(Project, { foreignKey: 'ProjectId' });

Project.belongsToMany(User, { through: ProjectUser, as: 'users', foreignKey: 'ProjectId' });
User.belongsToMany(Project, { through: ProjectUser, as: 'assignedProjects', foreignKey: 'UserId' });
Project.hasMany(ProjectUser, { as: 'ProjectUsers', foreignKey: 'ProjectId' });
ProjectUser.belongsTo(Project, { foreignKey: 'ProjectId' });
ProjectUser.belongsTo(User, { foreignKey: 'UserId' });
User.hasMany(ProjectUser, { foreignKey: 'UserId' });

Project.hasMany(Voucher, { foreignKey: 'ProjectId' });
Voucher.belongsTo(Project, { foreignKey: 'ProjectId' });

Project.hasMany(SalesInvoice, { foreignKey: 'ProjectId' });
SalesInvoice.belongsTo(Project, { foreignKey: 'ProjectId' });

Project.hasMany(PurchaseOrder, { foreignKey: 'ProjectId' });
PurchaseOrder.belongsTo(Project, { foreignKey: 'ProjectId' });

Project.hasMany(VendorCredit, { foreignKey: 'ProjectId' });
VendorCredit.belongsTo(Project, { foreignKey: 'ProjectId' });

Project.hasMany(AuditLog, { foreignKey: 'ProjectId' });
AuditLog.belongsTo(Project, { foreignKey: 'ProjectId' });

// 17. Timesheets
Company.hasMany(Timesheet, { foreignKey: 'CompanyId' });
Timesheet.belongsTo(Company, { foreignKey: 'CompanyId' });

Project.hasMany(Timesheet, { foreignKey: 'ProjectId' });
Timesheet.belongsTo(Project, { foreignKey: 'ProjectId' });

User.hasMany(Timesheet, { foreignKey: 'UserId' });
Timesheet.belongsTo(User, { foreignKey: 'UserId' });

ProjectTask.hasMany(Timesheet, { foreignKey: 'ProjectTaskId' });
Timesheet.belongsTo(ProjectTask, { foreignKey: 'ProjectTaskId' });

// 16. Vendor Credits
VendorCredit.hasMany(VendorCreditItem, { as: 'items', foreignKey: 'VendorCreditId', onDelete: 'CASCADE' });
VendorCreditItem.belongsTo(VendorCredit, { foreignKey: 'VendorCreditId' });
VendorCredit.belongsTo(Company, { foreignKey: 'CompanyId' });
Company.hasMany(VendorCredit, { foreignKey: 'CompanyId' });
VendorCredit.belongsTo(Ledger, { as: 'Vendor', foreignKey: 'vendorLedgerId' });
VendorCredit.belongsTo(Ledger, { as: 'APAccount', foreignKey: 'accountsPayableId' });
VendorCreditItem.belongsTo(Item, { foreignKey: 'itemId' });
VendorCreditItem.belongsTo(Ledger, { as: 'Account', foreignKey: 'accountId' });

// 18. Stock & Inventory Masters
Company.hasMany(StockGroup, { foreignKey: 'CompanyId' });
StockGroup.belongsTo(Company, { foreignKey: 'CompanyId' });

Company.hasMany(StockCategory, { foreignKey: 'CompanyId' });
StockCategory.belongsTo(Company, { foreignKey: 'CompanyId' });

Company.hasMany(UnitOfMeasure, { foreignKey: 'CompanyId' });
UnitOfMeasure.belongsTo(Company, { foreignKey: 'CompanyId' });

Company.hasMany(Godown, { foreignKey: 'CompanyId' });
Godown.belongsTo(Company, { foreignKey: 'CompanyId' });

Item.belongsTo(StockGroup, { foreignKey: 'stockGroupId' });
StockGroup.hasMany(Item, { foreignKey: 'stockGroupId' });

Item.belongsTo(StockCategory, { foreignKey: 'stockCategoryId' });
StockCategory.hasMany(Item, { foreignKey: 'stockCategoryId' });

Item.belongsTo(UnitOfMeasure, { foreignKey: 'unitOfMeasureId' });
UnitOfMeasure.hasMany(Item, { foreignKey: 'unitOfMeasureId' });

Item.belongsTo(Godown, { foreignKey: 'godownId' });
Godown.hasMany(Item, { foreignKey: 'godownId' });

// 19. Currency & Cost Category
Company.hasMany(Currency, { foreignKey: 'CompanyId' });
Currency.belongsTo(Company, { foreignKey: 'CompanyId' });

Company.hasMany(CostCategory, { foreignKey: 'CompanyId' });
CostCategory.belongsTo(Company, { foreignKey: 'CompanyId' });

CostCategory.hasMany(CostCenter, { foreignKey: 'costCategoryId' });
CostCenter.belongsTo(CostCategory, { foreignKey: 'costCategoryId' });

CostCenter.hasMany(CostCenter, { as: 'SubCostCenters', foreignKey: 'parentCostCenterId', onDelete: 'SET NULL' });
CostCenter.belongsTo(CostCenter, { as: 'ParentCostCenter', foreignKey: 'parentCostCenterId', onDelete: 'SET NULL' });

Company.hasMany(CostCenterAllocation, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID }, onDelete: 'CASCADE' });
CostCenterAllocation.belongsTo(Company, { foreignKey: { name: 'CompanyId', type: DataTypes.UUID } });

Transaction.hasMany(CostCenterAllocation, { foreignKey: { name: 'TransactionId', type: DataTypes.UUID }, onDelete: 'CASCADE' });
CostCenterAllocation.belongsTo(Transaction, { foreignKey: { name: 'TransactionId', type: DataTypes.UUID } });

CostCenter.hasMany(CostCenterAllocation, { foreignKey: { name: 'CostCenterId', type: DataTypes.UUID }, onDelete: 'CASCADE' });
CostCenterAllocation.belongsTo(CostCenter, { foreignKey: { name: 'CostCenterId', type: DataTypes.UUID } });



// 20. Payroll Models
Company.hasMany(Employee, { foreignKey: 'CompanyId' });
Employee.belongsTo(Company, { foreignKey: 'CompanyId' });

Company.hasMany(Attendance, { foreignKey: 'CompanyId' });
Attendance.belongsTo(Company, { foreignKey: 'CompanyId' });
Employee.hasMany(Attendance, { foreignKey: 'EmployeeId', onDelete: 'CASCADE' });
Attendance.belongsTo(Employee, { foreignKey: 'EmployeeId' });

Company.hasMany(SalaryStructure, { foreignKey: 'CompanyId' });
SalaryStructure.belongsTo(Company, { foreignKey: 'CompanyId' });
Employee.hasOne(SalaryStructure, { foreignKey: 'EmployeeId', onDelete: 'CASCADE' });
SalaryStructure.belongsTo(Employee, { foreignKey: 'EmployeeId' });

Company.hasMany(Payslip, { foreignKey: 'CompanyId' });
Payslip.belongsTo(Company, { foreignKey: 'CompanyId' });
Employee.hasMany(Payslip, { foreignKey: 'EmployeeId', onDelete: 'CASCADE' });
Payslip.belongsTo(Employee, { foreignKey: 'EmployeeId' });
Payslip.belongsTo(Voucher, { foreignKey: 'VoucherId', onDelete: 'SET NULL' });

// 21. Fixed Assets
Company.hasMany(FixedAsset, { foreignKey: 'CompanyId' });
FixedAsset.belongsTo(Company, { foreignKey: 'CompanyId' });
FixedAsset.belongsTo(Ledger, { as: 'AssetLedger', foreignKey: 'assetLedgerId' });
FixedAsset.belongsTo(Ledger, { as: 'DepreciationLedger', foreignKey: 'depreciationLedgerId' });

Company.hasMany(DepreciationLog, { foreignKey: 'CompanyId' });
DepreciationLog.belongsTo(Company, { foreignKey: 'CompanyId' });
FixedAsset.hasMany(DepreciationLog, { foreignKey: 'FixedAssetId', onDelete: 'CASCADE' });
DepreciationLog.belongsTo(FixedAsset, { foreignKey: 'FixedAssetId' });
DepreciationLog.belongsTo(Voucher, { foreignKey: 'VoucherId', onDelete: 'SET NULL' });

// 22. Manufacturing / BOM
Company.hasMany(BOM, { foreignKey: 'CompanyId' });
BOM.belongsTo(Company, { foreignKey: 'CompanyId' });
BOM.belongsTo(Item, { as: 'FinishedGood', foreignKey: 'finishedGoodItemId' });

Company.hasMany(BOMItem, { foreignKey: 'CompanyId' });
BOMItem.belongsTo(Company, { foreignKey: 'CompanyId' });
BOM.hasMany(BOMItem, { as: 'ingredients', foreignKey: 'BOMId', onDelete: 'CASCADE' });
BOMItem.belongsTo(BOM, { foreignKey: 'BOMId' });
BOMItem.belongsTo(Item, { as: 'RawMaterial', foreignKey: 'rawMaterialItemId' });

Company.hasMany(ProductionOrder, { foreignKey: 'CompanyId' });
ProductionOrder.belongsTo(Company, { foreignKey: 'CompanyId' });
ProductionOrder.belongsTo(BOM, { foreignKey: 'BOMId' });
ProductionOrder.belongsTo(Item, { as: 'FinishedGood', foreignKey: 'finishedGoodItemId' });
ProductionOrder.belongsTo(Voucher, { foreignKey: 'VoucherId', onDelete: 'SET NULL' });

// 23. Budgets
Company.hasMany(Budget, { foreignKey: 'CompanyId' });
Budget.belongsTo(Company, { foreignKey: 'CompanyId' });

Company.hasMany(BudgetItem, { foreignKey: 'CompanyId' });
BudgetItem.belongsTo(Company, { foreignKey: 'CompanyId' });
Budget.hasMany(BudgetItem, { as: 'items', foreignKey: 'BudgetId', onDelete: 'CASCADE' });
BudgetItem.belongsTo(Budget, { foreignKey: 'BudgetId' });
BudgetItem.belongsTo(Ledger, { foreignKey: 'LedgerId' });
BudgetItem.belongsTo(Group, { foreignKey: 'GroupId' });
Group.hasMany(BudgetItem, { foreignKey: 'GroupId' });


module.exports = {
  sequelize,
  User,
  Company,
  Group,
  Ledger,
  Voucher,
  Transaction,
  Item,
  BankTransaction,
  SalesOrder,
  SalesOrderItem,
  PurchaseOrder,
  PriceList,
  CostCenter,
  AuditLog,
  Quote,
  RetainerInvoice,
  RecurringInvoice,
  RetainerAdjustment,
  SalesInvoice,
  SalesInvoiceItem,
  SystemMail,
  CreditNote,
  CreditNoteItem,
  DeliveryChallan,
  DeliveryChallanItem,
  Project,
  ProjectTask,
  ProjectUser,
  RecurringExpense,
  RecurringBill,
  RecurringBillItem,
  VendorCredit,
  VendorCreditItem,
  Timesheet,
  StockGroup,
  StockCategory,
  UnitOfMeasure,
  Godown,
  Currency,
  CostCategory,
  Employee,
  Attendance,
  SalaryStructure,
  Payslip,
  FixedAsset,
  DepreciationLog,
  BOM,
  BOMItem,
  ProductionOrder,
  Budget,
  BudgetItem,
  CostCenterAllocation
};

