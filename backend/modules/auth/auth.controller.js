const { User } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.Client_ID);


exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user already exists to prevent generic 'Validation error'
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
       return res.status(400).json({ error: 'This email is already registered. Please sign in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Include role and name in payload
    const user = await User.create({ 
      email, 
      password: hashedPassword, 
      name: name || undefined,
      role: 'ADMIN' // Strictly enforce ADMIN role for new registrations to prevent SUPER_ADMIN bypass
    });
    res.status(201).json({ message: 'User created', user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    // If it's still a validation error, grab the specific field error
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
       return res.status(400).json({ error: err.errors[0].message });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { Company } = require('../../models');
    let user = await User.findOne({ 
      where: { email },
      include: [{ model: Company, through: { attributes: [] } }]
    });

    // If user doesn't exist, auto-register them
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({ 
        email, 
        password: hashedPassword, 
        name: email.split('@')[0],
        role: 'ADMIN'
      });
      // Re-fetch with Company association
      user = await User.findOne({ 
        where: { id: user.id },
        include: [{ model: Company, through: { attributes: [] } }]
      });
    } else {
      // User exists — verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials. Please check your password.' });
      }
    }

    let userCompanies = user.Companies || [];
    
    // Removed: We no longer auto-create a default company.
    // The frontend will detect companies.length === 0 and redirect to /setup-company

    let activeCoId = user.activeCompanyId;
    
    // Auto-set active company if they don't have one set but belong to exactly ONE
    if (!activeCoId && userCompanies.length === 1) {
       activeCoId = userCompanies[0].id;
       user.activeCompanyId = activeCoId;
       await user.save();
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, companyId: activeCoId }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );
    
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name, role: user.role, activeCompanyId: activeCoId },
      companies: userCompanies 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.switchCompany = async (req, res) => {
  try {
    const { companyId } = req.body;
    const { Company } = require('../../models');
    
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Company, through: { attributes: [] } }]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'SUPER_ADMIN') {
      const belongsToCompany = user.Companies && user.Companies.some(c => c.id === companyId);
      if (!belongsToCompany) {
        return res.status(403).json({ error: 'Access denied to this company' });
      }
    }

    user.activeCompanyId = companyId;
    await user.save();

    const token = jwt.sign(
      { id: user.id, role: user.role, companyId: user.activeCompanyId }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.json({ 
      message: 'Company switched successfully',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, activeCompanyId: user.activeCompanyId }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.Client_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name } = payload;
    
    const { Company } = require('../../models');
    let user = await User.findOne({ 
      where: { email },
      include: [{ model: Company, through: { attributes: [] } }]
    });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = await User.create({ 
        email, 
        password: hashedPassword, 
        name: name || email.split('@')[0],
        role: 'ADMIN'
      });
      user = await User.findOne({ 
        where: { id: user.id },
        include: [{ model: Company, through: { attributes: [] } }]
      });
    }

    let userCompanies = user.Companies || [];
    let activeCoId = user.activeCompanyId;
    
    if (!activeCoId && userCompanies.length === 1) {
       activeCoId = userCompanies[0].id;
       user.activeCompanyId = activeCoId;
       await user.save();
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, companyId: activeCoId }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );
    
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name, role: user.role, activeCompanyId: activeCoId },
      companies: userCompanies 
    });

  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(500).json({ error: 'Google Authentication Failed' });
  }
};
