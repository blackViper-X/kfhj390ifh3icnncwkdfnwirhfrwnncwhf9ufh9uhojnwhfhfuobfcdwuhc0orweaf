const prisma = require('../utils/prisma');
const { encrypt, decrypt } = require('../utils/encryption');
const { notFound, badRequest } = require('../utils/errors');
const { logAudit } = require('./auditService');
const { validatePlatform } = require('../utils/validation');
const logger = require('../utils/logger');

async function getSocialAccounts(companyId) {
  const accounts = await prisma.socialAccount.findMany({
    where: { companyId },
    include: {
      platformConfig: {
        select: {
          platform: true,
          isActive: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return accounts;
}

async function getSocialAccount(id) {
  const account = await prisma.socialAccount.findUnique({
    where: { id },
    include: {
      oauthCredential: {
        select: {
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!account) {
    throw notFound('Social account not found');
  }

  return account;
}

async function createOrUpdateSocialAccount(data) {
  const { companyId, platform, platformAccountId, accountName, platformConfigId } = data;

  const account = await prisma.socialAccount.create({
    data: {
      companyId,
      platform,
      platformAccountId,
      accountName,
      status: 'CONNECTED',
      platformConfigId,
    },
  });

  return account;
}

async function saveOAuthCredential(socialAccountId, accessToken, refreshToken, expiresAt) {
  const { encrypted: encryptedAccessToken, iv: accessTokenIv, authTag: accessTokenAuthTag } = encrypt(accessToken);
  
  let encryptedRefreshToken = null;
  let refreshTokenIv = null;
  let refreshTokenAuthTag = null;

  if (refreshToken) {
    const refreshEncrypted = encrypt(refreshToken);
    encryptedRefreshToken = refreshEncrypted.encrypted;
    refreshTokenIv = refreshEncrypted.iv;
    refreshTokenAuthTag = refreshEncrypted.authTag;
  }

  await prisma.oAuthCredential.upsert({
    where: { socialAccountId },
    update: {
      encryptedAccessToken,
      encryptedRefreshToken,
      iv: accessTokenIv,
      authTag: accessTokenAuthTag,
      expiresAt,
    },
    create: {
      socialAccountId,
      encryptedAccessToken,
      encryptedRefreshToken,
      iv: accessTokenIv,
      authTag: accessTokenAuthTag,
      expiresAt,
    },
  });
}

async function getDecryptedOAuthCredential(socialAccountId) {
  const credential = await prisma.oAuthCredential.findUnique({
    where: { socialAccountId },
  });

  if (!credential) {
    throw notFound('OAuth credential not found');
  }

  const accessToken = decrypt(credential.encryptedAccessToken, credential.iv, credential.authTag);
  const refreshToken = credential.encryptedRefreshToken
    ? decrypt(credential.encryptedRefreshToken, credential.iv, credential.authTag)
    : null;

  return {
    accessToken,
    refreshToken,
    expiresAt: credential.expiresAt,
  };
}

async function disconnectSocialAccount(id, actorId) {
  const account = await prisma.socialAccount.findUnique({
    where: { id },
  });

  if (!account) {
    throw notFound('Social account not found');
  }

  await prisma.socialAccount.update({
    where: { id },
    data: { status: 'DISCONNECTED' },
  });

  await logAudit({
    actorId,
    companyId: account.companyId,
    action: 'SOCIAL_ACCOUNT_DISCONNECTED',
    targetType: 'SocialAccount',
    targetId: id,
    metadata: { platform: account.platform },
    result: 'SUCCESS',
  });

  return { success: true };
}

async function updateSocialAccountStatus(id, status) {
  await prisma.socialAccount.update({
    where: { id },
    data: { status },
  });
}

module.exports = {
  getSocialAccounts,
  getSocialAccount,
  createOrUpdateSocialAccount,
  saveOAuthCredential,
  getDecryptedOAuthCredential,
  disconnectSocialAccount,
  updateSocialAccountStatus,
};
