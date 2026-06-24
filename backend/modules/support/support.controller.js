const { SupportTicket, User, Company } = require('../../models');

exports.createTicket = async (req, res) => {
  try {
    const { subject, message, currentPageUrl } = req.body;
    const companyId = req.companyId;
    const userId = req.user.id;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const ticket = await SupportTicket.create({
      subject,
      message,
      currentPageUrl,
      CompanyId: companyId,
      UserId: userId
    });

    res.status(201).json({ success: true, ticket });
  } catch (err) {
    console.error('Create Ticket Error:', err);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
};

exports.getCompanyTickets = async (req, res) => {
  try {
    const companyId = req.companyId;
    const tickets = await SupportTicket.findAll({
      where: { CompanyId: companyId },
      include: [{ model: User, as: 'Creator', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, tickets });
  } catch (err) {
    console.error('Get Tickets Error:', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

exports.getAllTicketsAdmin = async (req, res) => {
  try {
    // Only SUPER_ADMIN should access this. Middleware should handle auth.
    const tickets = await SupportTicket.findAll({
      include: [
        { model: User, as: 'Creator', attributes: ['name', 'email'] },
        { model: Company, as: 'Company', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, tickets });
  } catch (err) {
    console.error('Get All Tickets Error:', err);
    res.status(500).json({ error: 'Failed to fetch all tickets' });
  }
};

exports.replyToTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { adminReply, status } = req.body;

    const ticket = await SupportTicket.findByPk(ticketId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    ticket.adminReply = adminReply || ticket.adminReply;
    ticket.status = status || ticket.status;
    await ticket.save();

    res.json({ success: true, ticket });
  } catch (err) {
    console.error('Reply Ticket Error:', err);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
};
