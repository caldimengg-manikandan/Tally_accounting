const { Project, ProjectTask, ProjectUser, User, Ledger, sequelize } = require('./backend/models');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('Connection established.');
    
    // Check associations
    console.log('Project associations:', Object.keys(Project.associations));
    console.log('ProjectUser associations:', Object.keys(ProjectUser.associations));
    
    const projects = await Project.findAll({
      include: [
        { model: Ledger, as: 'Customer' },
        { model: ProjectTask, as: 'tasks' },
        { model: ProjectUser, include: [User] }
      ],
      limit: 1
    });
    console.log('Success, found:', projects.length);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.original) console.error('Original error:', error.original.message);
  } finally {
    await sequelize.close();
  }
}

test();
