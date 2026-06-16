const { sequelize, Employee } = require('./models');

async function deleteEmployees() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    // Delete all employees
    await Employee.destroy({ where: {} });
    console.log('All employees deleted successfully');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

deleteEmployees();
