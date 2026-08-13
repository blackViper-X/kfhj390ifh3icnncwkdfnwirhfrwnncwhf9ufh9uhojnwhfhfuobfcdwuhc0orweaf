const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../utils/prisma');
const { unauthorized, forbidden } = require('../utils/errors');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw unauthorized('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwtSecret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        systemRole: true,
      },
    });

    if (!user) {
      throw unauthorized('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(unauthorized('Invalid token'));
    }
    next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.systemRole)) {
      return next(forbidden('Insufficient permissions'));
    }

    next();
  };
}

async function requireCompanyAccess(req, res, next) {
  try {
    if (!req.user) {
      return next(unauthorized('Authentication required'));
    }

    // const companyId = req.params.companyId || req.body.companyId || req.query.companyId;
    const companyId = req.params.companyId || req.params.id || req.body.companyId;
    if (!companyId) {
      return next(forbidden('Company ID required'));
    }

    if (req.user.systemRole === 'SUPERUSER') {
      req.companyId = companyId;
      return next();
    }

    const membership = await prisma.companyMembership.findUnique({
      where: {
        userId_companyId: {
          userId: req.user.id,
          companyId,
        },
      },
    });

    if (!membership) {
      return next(forbidden('Access denied to this company'));
    }

    req.companyId = companyId;
    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticate,
  requireRole,
  requireCompanyAccess,
};
