const { Timesheet, Project, ProjectUser, User, ProjectTask } = require('../../models');

exports.logTime = async (req, res) => {
  try {
    const { 
      date, hours, description, ProjectId, UserId, ProjectTaskId, isBillable 
    } = req.body;

    // Fetch billing rate from ProjectUser association if not provided
    let billingRate = req.body.billingRate;
    if (!billingRate) {
      const pu = await ProjectUser.findOne({ where: { ProjectId, UserId } });
      billingRate = pu ? pu.billingRate : 0;
    }

    const timesheet = await Timesheet.create({
      date, hours, description, ProjectId, UserId, 
      ProjectTaskId: ProjectTaskId || null, 
      isBillable, billingRate,
      CompanyId: req.body.CompanyId
    });

    res.status(201).json(timesheet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProjectTimesheets = async (req, res) => {
  try {
    const { projectId } = req.params;
    const timesheets = await Timesheet.findAll({
      where: { ProjectId: projectId },
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: ProjectTask, attributes: ['id', 'name'] }
      ],
      order: [['date', 'DESC']]
    });
    res.json(timesheets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    await Timesheet.destroy({ where: { id } });
    res.json({ message: 'Timesheet entry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
