const { Employee, EmployeeSalaryAssignment, SalaryStructure } = require('./models');

async function test() {
  const employees = await Employee.findAll({
    include: [{
      model: EmployeeSalaryAssignment,
      required: false,
      include: [{
        model: SalaryStructure,
        as: 'structure'
      }]
    }]
  });
  
  console.log('Total employees:', employees.length);
  employees.forEach(e => {
    let gross = 0;
    if (e.EmployeeSalaryAssignments && e.EmployeeSalaryAssignments.length > 0) {
      const struct = e.EmployeeSalaryAssignments[0].structure;
      if (struct) gross = struct.grossSalary;
    }
    console.log(`Emp: ${e.name}, Active: ${e.active}, Bank: ${e.bankAccountNumber}, HasStructure: ${gross > 0}`);
  });
  process.exit(0);
}
test();
