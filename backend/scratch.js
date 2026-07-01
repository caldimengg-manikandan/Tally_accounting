const { Employee, EmployeeSalaryAssignment, SalaryStructure, SalarySlip, SalaryStructureComponent } = require('./models');

async function test() {
  try {
    const employees = await Employee.findAll({
      limit: 1,
      include: [{
        model: EmployeeSalaryAssignment,
        required: false,
        include: [{
          model: SalaryStructure,
          as: 'structure'
        }]
      }]
    });
    console.log("Success! Employees:", employees.length);
    
    // Also test SalarySlip
    const slips = await SalarySlip.findAll({
      limit: 1,
      include: [{ 
        model: Employee
      }]
    });
    console.log("Success! Slips:", slips.length);
  } catch (err) {
    console.error("ERROR CAUGHT:");
    console.error(err.message);
    if (err.parent) console.error("PARENT:", err.parent.message);
  }
}

test();
