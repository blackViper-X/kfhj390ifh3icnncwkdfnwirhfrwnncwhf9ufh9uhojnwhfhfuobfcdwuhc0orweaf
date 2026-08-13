const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

async function logAudit(data) {
  try {
    const { actorId, companyId, action, targetType, targetId, metadata, result } = data;

    await prisma.auditLog.create({
      data: {
        actorId,
        companyId,
        action,
        targetType,
        targetId,
        metadata,
        result,
      },
    });

    logger.info('Audit logged', { action, targetType, targetId, actorId });
  } catch (error) {
    logger.error('Failed to log audit', { error: error.message, data });
  }
}

module.exports = {
  logAudit,
};
