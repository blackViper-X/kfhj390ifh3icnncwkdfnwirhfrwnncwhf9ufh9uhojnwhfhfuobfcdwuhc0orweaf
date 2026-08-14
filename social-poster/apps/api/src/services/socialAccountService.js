// const prisma = require('../utils/prisma');
// const { encrypt, decrypt } = require('../utils/encryption');
// const { notFound, badRequest } = require('../utils/errors');
// const { logAudit } = require('./auditService');
// const { validatePlatform } = require('../utils/validation');
// const logger = require('../utils/logger');

// async function getSocialAccounts(companyId) {
//   const accounts = await prisma.socialAccount.findMany({
//     where: { companyId },
//     include: {
//       platformConfig: {
//         select: {
//           platform: true,
//           isActive: true,
//         },
//       },
//     },
//     orderBy: { createdAt: 'desc' },
//   });

//   return accounts;
// }

// async function getSocialAccount(id) {
//   const account = await prisma.socialAccount.findUnique({
//     where: { id },
//     include: {
//       oauthCredential: {
//         select: {
//           expiresAt: true,
//           createdAt: true,
//           updatedAt: true,
//         },
//       },
//     },
//   });

//   if (!account) {
//     throw notFound('Social account not found');
//   }

//   return account;
// }

// async function createOrUpdateSocialAccount(data) {
//   const { companyId, platform, platformAccountId, accountName, platformConfigId } = data;

//   const account = await prisma.socialAccount.create({
//     data: {
//       companyId,
//       platform,
//       platformAccountId,
//       accountName,
//       status: 'CONNECTED',
//       platformConfigId,
//     },
//   });

//   return account;
// }

// async function saveOAuthCredential(socialAccountId, accessToken, refreshToken, expiresAt) {
//   const { encrypted: encryptedAccessToken, iv: accessTokenIv, authTag: accessTokenAuthTag } = encrypt(accessToken);

//   let encryptedRefreshToken = null;
//   let refreshTokenIv = null;
//   let refreshTokenAuthTag = null;

//   if (refreshToken) {
//     const refreshEncrypted = encrypt(refreshToken);
//     encryptedRefreshToken = refreshEncrypted.encrypted;
//     refreshTokenIv = refreshEncrypted.iv;
//     refreshTokenAuthTag = refreshEncrypted.authTag;
//   }

//   await prisma.oAuthCredential.upsert({
//     where: { socialAccountId },
//     update: {
//       encryptedAccessToken,
//       encryptedRefreshToken,
//       iv: accessTokenIv,
//       authTag: accessTokenAuthTag,
//       expiresAt,
//     },
//     create: {
//       socialAccountId,
//       encryptedAccessToken,
//       encryptedRefreshToken,
//       iv: accessTokenIv,
//       authTag: accessTokenAuthTag,
//       expiresAt,
//     },
//   });
// }

// async function getDecryptedOAuthCredential(socialAccountId) {
//   const credential = await prisma.oAuthCredential.findUnique({
//     where: { socialAccountId },
//   });

//   if (!credential) {
//     throw notFound('OAuth credential not found');
//   }

//   const accessToken = decrypt(credential.encryptedAccessToken, credential.iv, credential.authTag);
//   const refreshToken = credential.encryptedRefreshToken
//     ? decrypt(credential.encryptedRefreshToken, credential.iv, credential.authTag)
//     : null;

//   return {
//     accessToken,
//     refreshToken,
//     expiresAt: credential.expiresAt,
//   };
// }

// async function disconnectSocialAccount(id, actorId) {
//   const account = await prisma.socialAccount.findUnique({
//     where: { id },
//   });

//   if (!account) {
//     throw notFound('Social account not found');
//   }

//   await prisma.socialAccount.update({
//     where: { id },
//     data: { status: 'DISCONNECTED' },
//   });

//   await logAudit({
//     actorId,
//     companyId: account.companyId,
//     action: 'SOCIAL_ACCOUNT_DISCONNECTED',
//     targetType: 'SocialAccount',
//     targetId: id,
//     metadata: { platform: account.platform },
//     result: 'SUCCESS',
//   });

//   return { success: true };
// }

// async function updateSocialAccountStatus(id, status) {
//   await prisma.socialAccount.update({
//     where: { id },
//     data: { status },
//   });
// }

// module.exports = {
//   getSocialAccounts,
//   getSocialAccount,
//   createOrUpdateSocialAccount,
//   saveOAuthCredential,
//   getDecryptedOAuthCredential,
//   disconnectSocialAccount,
//   updateSocialAccountStatus,
// };


const prisma = require('../utils/prisma');
const {
  encrypt,
  decrypt,
  encryptToString,
  decryptFromString,
  isPackedPayload,
} = require('../utils/encryption');
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

  if (!platformAccountId) {
    throw badRequest(
      `Could not determine the ${platform} account to connect. ` +
      'Ensure the authorizing user has an eligible page/channel/profile and granted all requested permissions.'
    );
  }

  // Reconnecting an already-linked account must update it in place rather
  // than inserting a duplicate row (the original always created).
  const existing = await prisma.socialAccount.findFirst({
    where: { companyId, platform, platformAccountId },
  });

  if (existing) {
    return prisma.socialAccount.update({
      where: { id: existing.id },
      data: {
        accountName,
        status: 'CONNECTED',
        platformConfigId,
      },
    });
  }

  return prisma.socialAccount.create({
    data: {
      companyId,
      platform,
      platformAccountId,
      accountName,
      status: 'CONNECTED',
      platformConfigId,
    },
  });
}

async function saveOAuthCredential(socialAccountId, accessToken, refreshToken, expiresAt) {
  if (!accessToken) {
    throw badRequest(
      'Cannot save OAuth credential: the platform returned no access token. ' +
      'Verify the client ID/secret and redirect URI configured for this company.'
    );
  }

  const { encrypted: encryptedAccessToken, iv: accessTokenIv, authTag: accessTokenAuthTag } = encrypt(accessToken);

  // The refresh token needs its own IV and auth tag. The schema only has one
  // iv/authTag pair (used by the access token), so the refresh token is stored
  // as a self-contained "v1:iv:authTag:ciphertext" string. Previously it was
  // encrypted with a fresh IV but saved against the access token's IV, which
  // made every refresh token undecryptable.
  const encryptedRefreshToken = refreshToken ? encryptToString(refreshToken) : null;

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

  let refreshToken = null;
  if (credential.encryptedRefreshToken) {
    if (isPackedPayload(credential.encryptedRefreshToken)) {
      refreshToken = decryptFromString(credential.encryptedRefreshToken);
    } else {
      // Legacy rows written before refresh tokens carried their own IV.
      // They cannot be decrypted; treat as absent so the caller re-authorizes
      // instead of crashing the publish worker.
      try {
        refreshToken = decrypt(credential.encryptedRefreshToken, credential.iv, credential.authTag);
      } catch (error) {
        logger.warn('Discarding undecryptable legacy refresh token; reconnect required', {
          socialAccountId,
          error: error.message,
        });
        refreshToken = null;
      }
    }
  }

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
