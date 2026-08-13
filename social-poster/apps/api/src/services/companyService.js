const prisma = require('../utils/prisma');
const { badRequest, notFound, conflict } = require('../utils/errors');
const { validateString, validateSlug } = require('../utils/validation');
const { logAudit } = require('./auditService');
const logger = require('../utils/logger');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

async function createCompany(data, actorId) {
  const { name, approvalRequired } = data;

  if (!validateString(name, 2, 200)) {
    throw badRequest('Company name must be between 2 and 200 characters');
  }

  let slug = slugify(name);
  const existingSlug = await prisma.company.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const company = await prisma.company.create({
    data: {
      name,
      slug,
      approvalRequired: approvalRequired || false,
    },
  });

  await logAudit({
    actorId,
    companyId: company.id,
    action: 'COMPANY_CREATED',
    targetType: 'Company',
    targetId: company.id,
    result: 'SUCCESS',
  });

  return company;
}

async function getCompanies() {
  return prisma.company.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          memberships: true,
          socialAccounts: true,
          posts: true,
        },
      },
    },
  });
}

async function getCompany(id) {
  const company = await prisma.company.findUnique({
    where: { id, deletedAt: null },
    include: {
      memberships: {
        include: { user: { select: { id: true, email: true, name: true } } },
      },
      platformConfigs: {
        select: {
          id: true,
          platform: true,
          clientId: true,
          redirectUri: true,
          scopes: true,
          isActive: true,
        },
      },
      socialAccounts: {
        select: {
          id: true,
          platform: true,
          platformAccountId: true,
          accountName: true,
          status: true,
        },
      },
      _count: {
        select: {
          posts: true,
          publications: true,
        },
      },
    },
  });

  if (!company) {
    throw notFound('Company not found');
  }

  return company;
}

async function updateCompany(id, data, actorId) {
  const company = await prisma.company.findUnique({
    where: { id, deletedAt: null },
  });

  if (!company) {
    throw notFound('Company not found');
  }

  const updateData = {};
  if (data.name && validateString(data.name, 2, 200)) {
    updateData.name = data.name;
  }
  if (typeof data.approvalRequired === 'boolean') {
    updateData.approvalRequired = data.approvalRequired;
  }

  const updated = await prisma.company.update({
    where: { id },
    data: updateData,
  });

  await logAudit({
    actorId,
    companyId: id,
    action: 'COMPANY_UPDATED',
    targetType: 'Company',
    targetId: id,
    metadata: updateData,
    result: 'SUCCESS',
  });

  return updated;
}

async function deleteCompany(id, actorId) {
  const company = await prisma.company.findUnique({
    where: { id, deletedAt: null },
  });

  if (!company) {
    throw notFound('Company not found');
  }

  await prisma.company.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await logAudit({
    actorId,
    companyId: id,
    action: 'COMPANY_DELETED',
    targetType: 'Company',
    targetId: id,
    result: 'SUCCESS',
  });

  return { success: true };
}

async function createManager(companyId, data, actorId) {
  const { email, name, password } = data;

  const bcrypt = require('bcrypt');
  const { validateEmail, validatePassword } = require('../utils/validation');

  if (!validateEmail(email)) {
    throw badRequest('Invalid email format');
  }
  if (!validateString(name, 2, 200)) {
    throw badRequest('Name must be between 2 and 200 characters');
  }
  if (!validatePassword(password)) {
    throw badRequest('Password must be at least 8 characters');
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId, deletedAt: null },
  });

  if (!company) {
    throw notFound('Company not found');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMembership = await prisma.companyMembership.findUnique({
      where: { userId_companyId: { userId: existingUser.id, companyId } },
    });
    if (existingMembership) {
      throw conflict('User is already a manager for this company');
    }

    await prisma.companyMembership.create({
      data: {
        userId: existingUser.id,
        companyId,
        role: 'COMPANY_MANAGER',
      },
    });

    await logAudit({
      actorId,
      companyId,
      action: 'MANAGER_ASSIGNED',
      targetType: 'User',
      targetId: existingUser.id,
      result: 'SUCCESS',
    });

    return { userId: existingUser.id, email, name: existingUser.name };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name,
        passwordHash,
        systemRole: 'COMPANY_MANAGER',
      },
    });

    await tx.companyMembership.create({
      data: {
        userId: user.id,
        companyId,
        role: 'COMPANY_MANAGER',
      },
    });

    return user;
  });

  await logAudit({
    actorId,
    companyId,
    action: 'MANAGER_CREATED',
    targetType: 'User',
    targetId: result.id,
    result: 'SUCCESS',
  });

  return { userId: result.id, email, name };
}

module.exports = {
  createCompany,
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
  createManager,
};
