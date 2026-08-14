// const { Worker } = require('bullmq');
// const config = require('../config');
// const { connection } = require('../queues');
// const prisma = require('../utils/prisma');
// const { getAdapter } = require('../adapters/social');
// const { getDecryptedConfig } = require('../services/platformConfigService');
// const { getDecryptedOAuthCredential, updateSocialAccountStatus } = require('../services/socialAccountService');
// const { updatePublicationTargetStatus, recordPublishingAttempt } = require('../services/publicationService');
// const storage = require('../utils/storage');
// const logger = require('../utils/logger');

// async function processPublishJob(job) {
//   const { publicationTargetId } = job.data;

//   logger.info('Processing publish job', { publicationTargetId, jobId: job.id });

//   const target = await prisma.publicationTarget.findUnique({
//     where: { id: publicationTargetId },
//     include: {
//       socialAccount: {
//         include: {
//           platformConfig: true,
//         },
//       },
//       postTarget: true,
//     },
//   });

//   if (!target) {
//     logger.error('Publication target not found', { publicationTargetId });
//     return;
//   }

//   if (target.status === 'PUBLISHED') {
//     logger.info('Target already published', { publicationTargetId });
//     return;
//   }

//   if (target.status === 'CANCELLED') {
//     logger.info('Target was cancelled', { publicationTargetId });
//     return;
//   }

//   try {
//     const socialAccount = target.socialAccount;

//     if (socialAccount.status !== 'CONNECTED') {
//       throw new Error('Social account is not connected');
//     }

//     const platformConfig = await getDecryptedConfig(socialAccount.companyId, socialAccount.platform);
//     const oauthCredential = await getDecryptedOAuthCredential(socialAccount.id);

//     if (oauthCredential.expiresAt && oauthCredential.expiresAt < new Date()) {
//       logger.info('Token expired, refreshing', { publicationTargetId });
//       const adapter = getAdapter(socialAccount.platform);
//       const newTokens = await adapter.refreshAccessToken({
//         clientId: platformConfig.clientId,
//         clientSecret: platformConfig.clientSecret,
//         refreshToken: oauthCredential.refreshToken,
//       });

//       const { encrypt } = require('../utils/encryption');
//       const { encrypted, iv, authTag } = encrypt(newTokens.accessToken);

//       await prisma.oAuthCredential.update({
//         where: { socialAccountId: socialAccount.id },
//         data: {
//           encryptedAccessToken: encrypted,
//           iv,
//           authTag,
//           expiresAt: newTokens.expiresAt,
//         },
//       });

//       oauthCredential.accessToken = newTokens.accessToken;
//     }

//     const adapter = getAdapter(socialAccount.platform);

//     let mediaUrl = null;
//     if (target.postTarget.platformMetadata?.mediaId) {
//       const media = await prisma.media.findUnique({
//         where: { id: target.postTarget.platformMetadata.mediaId },
//         include: {
//           variants: {
//             where: { platform: target.platform },
//           },
//         },
//       });

//       if (media) {
//         const variant = media.variants[0];
//         if (variant) {
//           mediaUrl = storage.getFileUrl(variant.variantKey);
//         } else {
//           mediaUrl = storage.getFileUrl(media.originalKey);
//         }
//       }
//     }

//     let result;

//     if (socialAccount.platform === 'FACEBOOK') {
//       result = await adapter.publishPost({
//         accessToken: oauthCredential.accessToken,
//         pageId: socialAccount.platformAccountId,
//         message: target.postTarget.caption,
//         imageUrl: mediaUrl,
//       });
//     } else if (socialAccount.platform === 'INSTAGRAM') {
//       result = await adapter.publishPost({
//         accessToken: oauthCredential.accessToken,
//         instagramAccountId: socialAccount.platformAccountId,
//         caption: target.postTarget.caption,
//         imageUrl: mediaUrl,
//       });
//     } else if (socialAccount.platform === 'YOUTUBE' || socialAccount.platform === 'YOUTUBE_SHORTS') {
//       result = await adapter.publishVideo({
//         accessToken: oauthCredential.accessToken,
//         title: target.postTarget.title,
//         description: target.postTarget.description,
//         tags: target.postTarget.keywords?.split(',').map((k) => k.trim()),
//         videoFilePath: mediaUrl,
//       });
//     } else if (socialAccount.platform === 'PINTEREST') {
//       result = await adapter.publishPin({
//         accessToken: oauthCredential.accessToken,
//         boardId: target.postTarget.platformMetadata?.boardId,
//         title: target.postTarget.title,
//         description: target.postTarget.description,
//         link: target.postTarget.platformMetadata?.link,
//         imageUrl: mediaUrl,
//       });
//     }

//     await updatePublicationTargetStatus(publicationTargetId, 'PUBLISHED', {
//       externalPostId: result.externalPostId,
//       externalUrl: result.externalUrl,
//     });

//     await recordPublishingAttempt(publicationTargetId, 'SUCCESS', null, result.externalPostId);

//     await prisma.postTarget.update({
//       where: { id: target.postTargetId },
//       data: {
//         externalPostId: result.externalPostId,
//         externalUrl: result.externalUrl,
//         platformStatus: 'PUBLISHED',
//       },
//     });

//     logger.info('Published successfully', { publicationTargetId, externalPostId: result.externalPostId });
//   } catch (error) {
//     logger.error('Publishing failed', {
//       publicationTargetId,
//       error: error.message,
//       stack: error.stack,
//     });

//     const isRetryable = error.response?.status >= 500 || error.response?.status === 429 || !error.response;

//     if (isRetryable && target.attempts < 3) {
//       await recordPublishingAttempt(publicationTargetId, 'RETRY', error.message, null);
//       throw error;
//     }

//     await updatePublicationTargetStatus(publicationTargetId, 'FAILED', {
//       errorMessage: error.message,
//     });

//     await recordPublishingAttempt(publicationTargetId, 'FAILED', error.message, null);

//     await prisma.postTarget.update({
//       where: { id: target.postTargetId },
//       data: {
//         platformStatus: 'FAILED',
//         errorMessage: error.message,
//       },
//     });

//     if (error.response?.status === 401 || error.response?.status === 403) {
//       await updateSocialAccountStatus(target.socialAccountId, 'REAUTH_REQUIRED');
//     }
//   }
// }

// const publishWorker = new Worker('post.publish', processPublishJob, {
//   connection,
//   concurrency: 5,
// });

// publishWorker.on('completed', (job) => {
//   logger.info('Publish job completed', { jobId: job.id });
// });

// publishWorker.on('failed', (job, err) => {
//   logger.error('Publish job failed', { jobId: job.id, error: err.message });
// });

// module.exports = publishWorker;


const { Worker } = require('bullmq');
const config = require('../config');
const { connection } = require('../queues');
const prisma = require('../utils/prisma');
const { getAdapter } = require('../adapters/social');
const { getDecryptedConfig } = require('../services/platformConfigService');
const { getDecryptedOAuthCredential, updateSocialAccountStatus } = require('../services/socialAccountService');
const { updatePublicationTargetStatus, recordPublishingAttempt } = require('../services/publicationService');
const storage = require('../utils/storage');
const logger = require('../utils/logger');

async function processPublishJob(job) {
  const { publicationTargetId } = job.data;

  logger.info('Processing publish job', { publicationTargetId, jobId: job.id });

  const target = await prisma.publicationTarget.findUnique({
    where: { id: publicationTargetId },
    include: {
      socialAccount: {
        include: {
          platformConfig: true,
        },
      },
      postTarget: true,
    },
  });

  if (!target) {
    logger.error('Publication target not found', { publicationTargetId });
    return;
  }

  if (target.status === 'PUBLISHED') {
    logger.info('Target already published', { publicationTargetId });
    return;
  }

  if (target.status === 'CANCELLED') {
    logger.info('Target was cancelled', { publicationTargetId });
    return;
  }

  try {
    const socialAccount = target.socialAccount;

    if (socialAccount.status !== 'CONNECTED') {
      throw new Error('Social account is not connected');
    }

    const platformConfig = await getDecryptedConfig(socialAccount.companyId, socialAccount.platform);
    const oauthCredential = await getDecryptedOAuthCredential(socialAccount.id);

    if (oauthCredential.expiresAt && oauthCredential.expiresAt < new Date()) {
      logger.info('Token expired, refreshing', { publicationTargetId });
      const adapter = getAdapter(socialAccount.platform);
      const newTokens = await adapter.refreshAccessToken({
        clientId: platformConfig.clientId,
        clientSecret: platformConfig.clientSecret,
        refreshToken: oauthCredential.refreshToken,
      });

      const { encrypt, encryptToString } = require('../utils/encryption');
      const { encrypted, iv, authTag } = encrypt(newTokens.accessToken);

      await prisma.oAuthCredential.update({
        where: { socialAccountId: socialAccount.id },
        data: {
          encryptedAccessToken: encrypted,
          iv,
          authTag,
          // Persist the rotated refresh token too (Pinterest/Google may issue
          // a new one); dropping it previously stranded the account after the
          // old token expired.
          ...(newTokens.refreshToken
            ? { encryptedRefreshToken: encryptToString(newTokens.refreshToken) }
            : {}),
          expiresAt: newTokens.expiresAt,
        },
      });

      oauthCredential.accessToken = newTokens.accessToken;
    }

    const adapter = getAdapter(socialAccount.platform);

    let mediaUrl = null;
    if (target.postTarget.platformMetadata?.mediaId) {
      const media = await prisma.media.findUnique({
        where: { id: target.postTarget.platformMetadata.mediaId },
        include: {
          variants: {
            where: { platform: target.platform },
          },
        },
      });

      if (media) {
        const variant = media.variants[0];
        if (variant) {
          mediaUrl = storage.getFileUrl(variant.variantKey);
        } else {
          mediaUrl = storage.getFileUrl(media.originalKey);
        }
      }
    }

    let result;

    if (socialAccount.platform === 'FACEBOOK') {
      result = await adapter.publishPost({
        accessToken: oauthCredential.accessToken,
        pageId: socialAccount.platformAccountId,
        message: target.postTarget.caption,
        imageUrl: mediaUrl,
      });
    } else if (socialAccount.platform === 'INSTAGRAM') {
      result = await adapter.publishPost({
        accessToken: oauthCredential.accessToken,
        instagramAccountId: socialAccount.platformAccountId,
        caption: target.postTarget.caption,
        imageUrl: mediaUrl,
      });
    } else if (socialAccount.platform === 'YOUTUBE' || socialAccount.platform === 'YOUTUBE_SHORTS') {
      result = await adapter.publishVideo({
        accessToken: oauthCredential.accessToken,
        title: target.postTarget.title,
        description: target.postTarget.description,
        tags: target.postTarget.keywords?.split(',').map((k) => k.trim()),
        videoFilePath: mediaUrl,
      });
    } else if (socialAccount.platform === 'PINTEREST') {
      result = await adapter.publishPin({
        accessToken: oauthCredential.accessToken,
        boardId: target.postTarget.platformMetadata?.boardId,
        title: target.postTarget.title,
        description: target.postTarget.description,
        link: target.postTarget.platformMetadata?.link,
        imageUrl: mediaUrl,
      });
    }

    await updatePublicationTargetStatus(publicationTargetId, 'PUBLISHED', {
      externalPostId: result.externalPostId,
      externalUrl: result.externalUrl,
    });

    await recordPublishingAttempt(publicationTargetId, 'SUCCESS', null, result.externalPostId);

    await prisma.postTarget.update({
      where: { id: target.postTargetId },
      data: {
        externalPostId: result.externalPostId,
        externalUrl: result.externalUrl,
        platformStatus: 'PUBLISHED',
      },
    });

    logger.info('Published successfully', { publicationTargetId, externalPostId: result.externalPostId });
  } catch (error) {
    logger.error('Publishing failed', {
      publicationTargetId,
      error: error.message,
      stack: error.stack,
    });

    const isRetryable = error.response?.status >= 500 || error.response?.status === 429 || !error.response;

    if (isRetryable && target.attempts < 3) {
      await recordPublishingAttempt(publicationTargetId, 'RETRY', error.message, null);
      throw error;
    }

    await updatePublicationTargetStatus(publicationTargetId, 'FAILED', {
      errorMessage: error.message,
    });

    await recordPublishingAttempt(publicationTargetId, 'FAILED', error.message, null);

    await prisma.postTarget.update({
      where: { id: target.postTargetId },
      data: {
        platformStatus: 'FAILED',
        errorMessage: error.message,
      },
    });

    if (error.response?.status === 401 || error.response?.status === 403) {
      await updateSocialAccountStatus(target.socialAccountId, 'REAUTH_REQUIRED');
    }
  }
}

const publishWorker = new Worker('post.publish', processPublishJob, {
  connection,
  concurrency: 5,
});

publishWorker.on('completed', (job) => {
  logger.info('Publish job completed', { jobId: job.id });
});

publishWorker.on('failed', (job, err) => {
  logger.error('Publish job failed', { jobId: job.id, error: err.message });
});

module.exports = publishWorker;
