const { Project, ProjectTask, ProjectUser, User, Ledger } = require('../../models');

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
    const projects = await Project.findAll({
      where: { CompanyId: req.params.companyId },
      include: [
        { model: Ledger, as: 'Customer' },
        { model: ProjectTask, as: 'tasks' },
        { model: ProjectUser, include: [User] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: Ledger, as: 'Customer' },
        { model: ProjectTask, as: 'tasks' },
        { model: ProjectUser, include: [User] }
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
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await project.update(req.body);

    // For simplicity, we could handle task/user updates here too
    // but typically they might have their own endpoints.
    
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await project.destroy();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
