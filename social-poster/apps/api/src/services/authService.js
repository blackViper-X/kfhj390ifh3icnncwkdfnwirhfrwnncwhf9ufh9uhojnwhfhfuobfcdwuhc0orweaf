const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const config = require('../config');
const { badRequest, unauthorized, conflict } = require('../utils/errors');
const { validateEmail, validatePassword } = require('../utils/validation');

async function login(email, password) {
  if (!validateEmail(email)) {
    throw badRequest('Invalid email format');
  }

  if (!password) {
    throw badRequest('Password is required');
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw unauthorized('Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw unauthorized('Invalid credentials');
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.systemRole,
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      systemRole: user.systemRole,
    },
  };
}

async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      systemRole: true,
      memberships: {
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw unauthorized('User not found');
  }

  return user;
}

module.exports = {
  login,
  getCurrentUser,
};
