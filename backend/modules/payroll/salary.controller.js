const { 
  SalaryComponent, 
  SalaryStructure, 
  SalaryStructureComponent, 
  EmployeeSalaryAssignment, 
  Employee,
  sequelize 
} = require('../../models');
const { Op } = require('sequelize');
const SalaryService = require('./salary.service');

// ─── SALARY COMPONENTS CRUD ────────────────────────────────────

exports.getComponents = async (req, res) => {
  try {
    const companyId = req.companyId;
    if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

    const components = await SalaryComponent.findAll({
      where: { CompanyId: companyId, isActive: true },
      order: [['displayOrder', 'ASC'], ['code', 'ASC']]
    });

    res.json({ success: true, data: components });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createComponent = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { 
      name, code, type, calculationType, calculationBase, 
      calculationValue, isStatutory, isTaxable, displayOrder, description 
    } = req.body;

    if (!name || !code || !type || !calculationType) {
      return res.status(400).json({ error: 'name, code, type, and calculationType are required' });
    }

    // Check code duplication for active ones
    const duplicate = await SalaryComponent.findOne({
      where: { CompanyId: companyId, code, isActive: true }
    });
    if (duplicate) {
      return res.status(409).json({ error: `Salary component with code "${code}" already exists.` });
    }

    const component = await SalaryComponent.create({
      CompanyId: companyId,
      name,
      code: code.toUpperCase(),
      type,
      calculationType,
      calculationBase: calculationType === 'Percentage' ? calculationBase : null,
      calculationValue: calculationValue || 0,
      isStatutory: isStatutory === true,
      isTaxable: isTaxable !== false, // default to true
      displayOrder: displayOrder || 0,
      description,
      CreatedBy: req.user?.id,
      UpdatedBy: req.user?.id
    });

    res.status(201).json({ success: true, message: 'Salary component created successfully', data: component });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateComponent = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { id } = req.params;
    const { 
      name, code, type, calculationType, calculationBase, 
      calculationValue, isStatutory, isTaxable, displayOrder, description 
    } = req.body;

    const component = await SalaryComponent.findOne({
      where: { id, CompanyId: companyId, isActive: true }
    });
    if (!component) return res.status(404).json({ error: 'Salary component not found' });

    if (code && code.toUpperCase() !== component.code) {
      const duplicate = await SalaryComponent.findOne({
        where: { CompanyId: companyId, code: code.toUpperCase(), isActive: true }
      });
      if (duplicate) {
        return res.status(409).json({ error: `Salary component with code "${code}" already exists.` });
      }
    }

    await component.update({
      ...(name && { name }),
      ...(code && { code: code.toUpperCase() }),
      ...(type && { type }),
      ...(calculationType && { calculationType }),
      calculationBase: calculationType === 'Percentage' ? calculationBase : (calculationType ? null : component.calculationBase),
      ...(calculationValue !== undefined && { calculationValue }),
      ...(isStatutory !== undefined && { isStatutory }),
      ...(isTaxable !== undefined && { isTaxable }),
      ...(displayOrder !== undefined && { displayOrder }),
      ...(description !== undefined && { description }),
      UpdatedBy: req.user?.id
    });

    res.json({ success: true, message: 'Salary component updated successfully', data: component });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteComponent = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { id } = req.params;

    const component = await SalaryComponent.findOne({
      where: { id, CompanyId: companyId, isActive: true }
    });
    if (!component) return res.status(404).json({ error: 'Salary component not found' });

    // Check if component is used in any active structures
    const associated = await SalaryStructureComponent.findOne({
      where: { SalaryComponentId: id, isActive: true }
    });
    if (associated) {
      return res.status(400).json({ error: 'Cannot delete component because it is actively used in one or more Salary Structures' });
    }

    // Soft delete
    await component.update({ isActive: false, UpdatedBy: req.user?.id });
    res.json({ success: true, message: 'Salary component deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ─── SALARY STRUCTURES (GRADES) CRUD ───────────────────────────

exports.getStructures = async (req, res) => {
  try {
    const companyId = req.companyId;

    const structures = await SalaryStructure.findAll({
      where: { CompanyId: companyId, isActive: true },
      include: [
        {
          model: SalaryStructureComponent,
          as: 'components',
          where: { isActive: true },
          required: false,
          include: [
            {
              model: SalaryComponent,
              as: 'component'
            }
          ]
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({ success: true, data: structures });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStructureById = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { id } = req.params;

    const structure = await SalaryStructure.findOne({
      where: { id, CompanyId: companyId, isActive: true },
      include: [
        {
          model: SalaryStructureComponent,
          as: 'components',
          where: { isActive: true },
          required: false,
          include: [
            {
              model: SalaryComponent,
              as: 'component'
            }
          ]
        }
      ]
    });

    if (!structure) return res.status(404).json({ error: 'Salary structure not found' });
    res.json({ success: true, data: structure });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createStructure = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const companyId = req.companyId;
    const { name, code, description, gradeLevel, effectiveFrom, components } = req.body;

    if (!name || !code || !effectiveFrom) {
      await transaction.rollback();
      return res.status(400).json({ error: 'name, code, and effectiveFrom are required' });
    }

    // Check duplicate structure code
    const duplicate = await SalaryStructure.findOne({
      where: { CompanyId: companyId, code, isActive: true }
    });
    if (duplicate) {
      await transaction.rollback();
      return res.status(409).json({ error: `Salary structure with code "${code}" already exists.` });
    }

    const structure = await SalaryStructure.create({
      CompanyId: companyId,
      name,
      code: code.toUpperCase(),
      description,
      gradeLevel,
      effectiveFrom,
      CreatedBy: req.user?.id,
      UpdatedBy: req.user?.id
    }, { transaction });

    // Link selected components
    if (Array.isArray(components) && components.length > 0) {
      for (const item of components) {
        if (!item.SalaryComponentId) continue;
        await SalaryStructureComponent.create({
          SalaryStructureId: structure.id,
          SalaryComponentId: item.SalaryComponentId,
          CompanyId: companyId,
          overrideCalculationType: item.overrideCalculationType || null,
          overrideCalculationValue: item.overrideCalculationValue !== undefined ? item.overrideCalculationValue : null,
          displayOrder: item.displayOrder || 0
        }, { transaction });
      }
    }

    await transaction.commit();

    // Fetch full created structure
    const full = await SalaryStructure.findOne({
      where: { id: structure.id },
      include: [
        {
          model: SalaryStructureComponent,
          as: 'components',
          where: { isActive: true },
          required: false,
          include: [{ model: SalaryComponent, as: 'component' }]
        }
      ]
    });

    res.status(201).json({ success: true, message: 'Salary structure created successfully', data: full });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: err.message });
  }
};

exports.updateStructure = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const companyId = req.companyId;
    const { id } = req.params;
    const { name, code, description, gradeLevel, effectiveFrom, components } = req.body;

    const structure = await SalaryStructure.findOne({
      where: { id, CompanyId: companyId, isActive: true }
    });
    if (!structure) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Salary structure not found' });
    }

    if (code && code.toUpperCase() !== structure.code) {
      const duplicate = await SalaryStructure.findOne({
        where: { CompanyId: companyId, code: code.toUpperCase(), isActive: true }
      });
      if (duplicate) {
        await transaction.rollback();
        return res.status(409).json({ error: `Salary structure with code "${code}" already exists.` });
      }
    }

    await structure.update({
      ...(name && { name }),
      ...(code && { code: code.toUpperCase() }),
      ...(description !== undefined && { description }),
      ...(gradeLevel !== undefined && { gradeLevel }),
      ...(effectiveFrom && { effectiveFrom }),
      UpdatedBy: req.user?.id
    }, { transaction });

    // Update components list (soft delete old mappings, insert new/updated ones)
    if (components && Array.isArray(components)) {
      // Deactivate all current components
      await SalaryStructureComponent.update(
        { isActive: false },
        { where: { SalaryStructureId: id }, transaction }
      );

      for (const item of components) {
        if (!item.SalaryComponentId) continue;
        
        // Upsert or re-create
        await SalaryStructureComponent.create({
          SalaryStructureId: id,
          SalaryComponentId: item.SalaryComponentId,
          CompanyId: companyId,
          overrideCalculationType: item.overrideCalculationType || null,
          overrideCalculationValue: item.overrideCalculationValue !== undefined ? item.overrideCalculationValue : null,
          displayOrder: item.displayOrder || 0
        }, { transaction });
      }
    }

    await transaction.commit();

    const full = await SalaryStructure.findOne({
      where: { id },
      include: [
        {
          model: SalaryStructureComponent,
          as: 'components',
          where: { isActive: true },
          required: false,
          include: [{ model: SalaryComponent, as: 'component' }]
        }
      ]
    });

    res.json({ success: true, message: 'Salary structure updated successfully', data: full });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: err.message });
  }
};

exports.deleteStructure = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { id } = req.params;

    const structure = await SalaryStructure.findOne({
      where: { id, CompanyId: companyId, isActive: true }
    });
    if (!structure) return res.status(404).json({ error: 'Salary structure not found' });

    // Check if any employees are active under this structure
    const assigned = await EmployeeSalaryAssignment.findOne({
      where: { SalaryStructureId: id, isActive: true }
    });
    if (assigned) {
      return res.status(400).json({ error: 'Cannot delete structure because it is actively assigned to one or more employees.' });
    }

    await structure.update({ isActive: false, UpdatedBy: req.user?.id });
    res.json({ success: true, message: 'Salary structure deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ─── EMPLOYEE SALARY ASSIGNMENT CRUD ───────────────────────────

exports.getAssignments = async (req, res) => {
  try {
    const companyId = req.companyId;

    const assignments = await EmployeeSalaryAssignment.findAll({
      where: { CompanyId: companyId, isActive: true },
      include: [
        {
          model: Employee,
          attributes: ['id', 'employeeId', 'name', 'department', 'designation']
        },
        {
          model: SalaryStructure,
          as: 'structure',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [[Employee, 'name', 'ASC']]
    });

    res.json({ success: true, data: assignments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEmployeeAssignmentDetails = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { employeeId } = req.params;

    const details = await SalaryService.getEmployeeSalaryDetails(employeeId, companyId);
    if (!details) {
      return res.status(404).json({ success: false, error: 'No active salary assignment found for this employee.' });
    }

    res.json({ success: true, data: details });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.assignSalary = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const companyId = req.companyId;
    const { employeeId, salaryStructureId, ctcAmount, basicAmount, effectiveFrom, remarks } = req.body;

    if (!employeeId || !salaryStructureId || !ctcAmount || !effectiveFrom) {
      await transaction.rollback();
      return res.status(400).json({ error: 'employeeId, salaryStructureId, ctcAmount, and effectiveFrom are required' });
    }

    // Verify employee and structure belong to the company
    const employee = await Employee.findOne({ where: { id: employeeId, CompanyId: companyId } });
    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Employee not found' });
    }

    const structure = await SalaryStructure.findOne({ where: { id: salaryStructureId, CompanyId: companyId, isActive: true } });
    if (!structure) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Salary structure not found' });
    }

    // Deactivate current active assignments for this employee
    await EmployeeSalaryAssignment.update(
      { isActive: false, effectiveTo: effectiveFrom },
      { where: { EmployeeId: employeeId, CompanyId: companyId, isActive: true }, transaction }
    );

    // Create new assignment
    const assignment = await EmployeeSalaryAssignment.create({
      CompanyId: companyId,
      EmployeeId: employeeId,
      SalaryStructureId: salaryStructureId,
      ctcAmount,
      basicAmount: basicAmount || null,
      effectiveFrom,
      remarks,
      CreatedBy: req.user?.id,
      UpdatedBy: req.user?.id
    }, { transaction });

    await transaction.commit();

    const fullDetails = await SalaryService.getEmployeeSalaryDetails(employeeId, companyId);
    res.status(201).json({ success: true, message: 'Salary assigned successfully', data: fullDetails });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: err.message });
  }
};

exports.removeAssignment = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { id } = req.params;

    const assignment = await EmployeeSalaryAssignment.findOne({
      where: { id, CompanyId: companyId, isActive: true }
    });
    if (!assignment) return res.status(404).json({ error: 'Salary assignment not found' });

    await assignment.update({ isActive: false, UpdatedBy: req.user?.id });
    res.json({ success: true, message: 'Salary assignment deactivated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ─── SALARY PREVIEW / CALCULATION ENDPOINT ────────────────────

exports.calculatePreview = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { ctcAmount, basicAmount, salaryStructureId, components } = req.body;

    if (!ctcAmount) {
      return res.status(400).json({ error: 'ctcAmount is required' });
    }

    let targetComponents = [];

    if (salaryStructureId) {
      // Retrieve components from structure
      const scList = await SalaryStructureComponent.findAll({
        where: { SalaryStructureId: salaryStructureId, isActive: true },
        include: [{ model: SalaryComponent, as: 'component' }]
      });
      targetComponents = scList;
    } else if (Array.isArray(components)) {
      // Components passed in manually (useful in form UI live creation)
      // Resolve Component model values
      const componentIds = components.map(c => c.SalaryComponentId);
      const dbComponents = await SalaryComponent.findAll({
        where: { id: componentIds, CompanyId: companyId }
      });
      const dbCompMap = {};
      dbComponents.forEach(c => { dbCompMap[c.id] = c; });

      targetComponents = components.map(c => ({
        overrideCalculationType: c.overrideCalculationType || null,
        overrideCalculationValue: c.overrideCalculationValue !== undefined ? c.overrideCalculationValue : null,
        displayOrder: c.displayOrder || 0,
        component: dbCompMap[c.SalaryComponentId]
      })).filter(tc => tc.component !== undefined);
    } else {
      // Default fallback: get all active standard components for the company
      const standardComps = await SalaryComponent.findAll({
        where: { CompanyId: companyId, isActive: true }
      });
      targetComponents = standardComps.map(c => ({
        overrideCalculationType: null,
        overrideCalculationValue: null,
        displayOrder: c.displayOrder,
        component: c
      }));
    }

    const result = SalaryService.calculateSalaryBreakdown(
      Number(ctcAmount),
      targetComponents,
      basicAmount ? Number(basicAmount) : null
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
