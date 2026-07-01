const { Project, Company, Ledger } = require('./models');

async function test() {
  try {
    const companies = await Company.findAll();
    console.log('Companies found:', companies.map(c => ({ id: c.id, name: c.name })));
    
    const projects = await Project.findAll({
      include: [
        { model: Ledger, as: 'Customer' }
      ]
    });
    console.log('Projects count:', projects.length);
    console.log('Projects details:', projects.map(p => ({ id: p.id, name: p.name, CompanyId: p.CompanyId })));
  } catch (error) {
    console.error('Error during DB query:', error);
  } finally {
    process.exit();
  }
}

test();
