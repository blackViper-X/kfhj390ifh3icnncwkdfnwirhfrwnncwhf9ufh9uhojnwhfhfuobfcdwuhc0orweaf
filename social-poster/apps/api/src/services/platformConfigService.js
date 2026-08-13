const prisma = require('../utils/prisma');
const { encrypt, decrypt } = require('../utils/encryption');
const { badRequest, notFound } = require('../utils/errors');
const { validatePlatform, validateString } = require('../utils/validation');
const { logAudit } = require('./auditService');

async function getPlatformConfigs(companyId) {
  const configs = await prisma.companyPlatformConfig.findMany({
    where: { companyId },
    select: {
      id: true,
      platform: true,
      clientId: true,
      redirectUri: true,
      scopes: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return configs.map((config) => ({
    ...config,
    hasSecret: true,
  }));
}

// async function createOrUpdatePlatformConfig(companyId, data, actorId) {

//   const { platform, clientId: rawClientId, clientSecret: rawClientSecret, redirectUri: rawRedirectUri, scopes: rawScopes } = data;

//   const clientId = (rawClientId || '').trim();
//   const clientSecret = (rawClientSecret || '').trim();
//   const redirectUri = (rawRedirectUri || '').trim();
//   const scopes = (rawScopes || '').trim();

//   if (!validatePlatform(platform)) {
//     throw badRequest('Invalid platform');
//   }
//   if (!validateString(clientId)) {
//     throw badRequest('Client ID is required');
//   }
//   if (!validateString(clientSecret)) {
//     throw badRequest('Client secret is required');
//   }
//   if (!validateString(redirectUri)) {
//     throw badRequest('Redirect URI is required');
//   }

//   const { encrypted, iv, authTag } = encrypt(clientSecret);

//   const config = await prisma.companyPlatformConfig.upsert({
//     where: {
//       companyId_platform: {
//         companyId,
//         platform,
//       },
//     },
//     update: {
//       clientId,
//       encryptedClientSecret: encrypted,
//       iv,
//       authTag,
//       redirectUri,
//       scopes: scopes || '',
//       isActive: true,
//     },
//     create: {
//       companyId,
//       platform,
//       clientId,
//       encryptedClientSecret: encrypted,
//       iv,
//       authTag,
//       redirectUri,
//       scopes: scopes || '',
//       isActive: true,
//     },
//   });


async function createOrUpdatePlatformConfig(companyId, data, actorId) {
  const { platform, clientId: rawClientId, clientSecret: rawClientSecret, redirectUri: rawRedirectUri, scopes: rawScopes } = data;

  const clientId = (rawClientId || '').trim();
  const clientSecret = (rawClientSecret || '').trim();
  const redirectUri = (rawRedirectUri || '').trim();
  const scopes = (rawScopes || '').trim();

  if (!validatePlatform(platform)) throw badRequest('Invalid platform');
  if (!validateString(clientId)) throw badRequest('Client ID is required');
  if (!validateString(redirectUri)) throw badRequest('Redirect URI is required');

  const existing = await prisma.companyPlatformConfig.findUnique({
    where: { companyId_platform: { companyId, platform } },
  });

  let secretData;
  if (existing && !clientSecret) {
    secretData = { encryptedClientSecret: existing.encryptedClientSecret, iv: existing.iv, authTag: existing.authTag };
  } else {
    if (!validateString(clientSecret)) throw badRequest('Client secret is required for new configurations');
    const encrypted = encrypt(clientSecret);
    secretData = { encryptedClientSecret: encrypted.encrypted, iv: encrypted.iv, authTag: encrypted.authTag };
  }

  const config = await prisma.companyPlatformConfig.upsert({
    where: { companyId_platform: { companyId, platform } },
    update: { clientId, ...secretData, redirectUri, scopes: scopes || '', isActive: true },
    create: { companyId, platform, clientId, ...secretData, redirectUri, scopes: scopes || '', isActive: true },
  });

  await logAudit({
    actorId,
    companyId,
    action: 'PLATFORM_CONFIG_UPDATED',
    targetType: 'CompanyPlatformConfig',
    targetId: config.id,
    metadata: { platform },
    result: 'SUCCESS',
  });

  return {
    id: config.id,
    platform: config.platform,
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    scopes: config.scopes,
    isActive: config.isActive,
  };
}

async function deletePlatformConfig(companyId, platform, actorId) {
  if (!validatePlatform(platform)) {
    throw badRequest('Invalid platform');
  }

  const config = await prisma.companyPlatformConfig.findUnique({
    where: {
      companyId_platform: {
        companyId,
        platform,
      },
    },
  });

  if (!config) {
    throw notFound('Platform configuration not found');
  }

  await prisma.companyPlatformConfig.delete({
    where: { id: config.id },
  });

  await logAudit({
    actorId,
    companyId,
    action: 'PLATFORM_CONFIG_DELETED',
    targetType: 'CompanyPlatformConfig',
    targetId: config.id,
    metadata: { platform },
    result: 'SUCCESS',
  });

  return { success: true };
}

async function getDecryptedConfig(companyId, platform) {
  const config = await prisma.companyPlatformConfig.findUnique({
    where: {
      companyId_platform: {
        companyId,
        platform,
      },
    },
  });

  if (!config || !config.isActive) {
    throw notFound('Platform configuration not found or inactive');
  }

  const clientSecret = decrypt(config.encryptedClientSecret, config.iv, config.authTag);

  return {
    ...config,
    clientSecret,
  };
}

module.exports = {
  getPlatformConfigs,
  createOrUpdatePlatformConfig,
  deletePlatformConfig,
  getDecryptedConfig,
};
