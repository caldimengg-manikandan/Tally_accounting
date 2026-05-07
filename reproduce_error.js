const { Project, ProjectTask, ProjectUser, User, Ledger, sequelize } = require('./backend/models');

async function test() {
  const companyId = '5f028981-8de4-4c19-9a90-54257dd87f70'; // The MOON Enterprises
  try {
    await sequelize.authenticate();
    console.log('Connection established.');
    
    const projects = await Project.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: Ledger, as: 'Customer' },
        { model: ProjectTask, as: 'tasks' },
        { model: ProjectUser, as: 'ProjectUsers', include: [User] }
      ],
      order: [['createdAt', 'DESC']]
    });
    console.log('Projects found:', projects.length);
  } catch (error) {
    console.error('FULL ERROR:', error);
    if (error.original) console.error('ORIGINAL ERROR:', error.original);
  } finally {
    await sequelize.close();
  }
}

test();
