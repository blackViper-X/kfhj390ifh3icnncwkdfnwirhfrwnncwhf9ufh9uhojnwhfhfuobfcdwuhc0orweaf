// const prisma = require('../utils/prisma');
// const { badRequest, notFound, forbidden } = require('../utils/errors');
// const { validatePlatform } = require('../utils/validation');
// const { logAudit } = require('./auditService');

// async function createPost(companyId, creatorId, data) {
//   const { targets, globalMediaMode, scheduledAt, timezone } = data;

//   if (!targets || !Array.isArray(targets) || targets.length === 0) {
//     throw badRequest('At least one platform target is required');
//   }

//   for (const target of targets) {
//     if (!validatePlatform(target.platform)) {
//       throw badRequest(`Invalid platform: ${target.platform}`);
//     }
//     if (!target.socialAccountId) {
//       throw badRequest(`Social account ID is required for platform: ${target.platform}`);
//     }
//   }

//   const post = await prisma.post.create({
//     data: {
//       companyId,
//       creatorId,
//       contentStatus: 'DRAFT',
//       approvalStatus: 'NOT_REQUIRED',
//       globalMediaMode: globalMediaMode || 'INTELLIGENT',
//       scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
//       timezone,
//       targets: {
//         create: targets.map((t) => ({
//           platform: t.platform,
//           socialAccountId: t.socialAccountId,
//           caption: t.caption,
//           title: t.title,
//           description: t.description,
//           hashtags: t.hashtags,
//           keywords: t.keywords,
//           thumbnailUrl: t.thumbnailUrl,
//           platformMetadata: t.platformMetadata,
//         })),
//       },
//     },
//     include: {
//       targets: true,
//     },
//   });

//   await createPostVersion(post.id, 1, creatorId);

//   await logAudit({
//     actorId: creatorId,
//     companyId,
//     action: 'POST_CREATED',
//     targetType: 'Post',
//     targetId: post.id,
//     result: 'SUCCESS',
//   });

//   return post;
// }

// async function getPost(id, companyId) {
//   const post = await prisma.post.findFirst({
//     where: { id, companyId },
//     include: {
//       targets: {
//         include: {
//           socialAccount: {
//             select: {
//               id: true,
//               platform: true,
//               accountName: true,
//               status: true,
//             },
//           },
//         },
//       },
//       media: {
//         include: {
//           variants: true,
//         },
//       },
//       publications: {
//         include: {
//           targets: true,
//         },
//         orderBy: { createdAt: 'desc' },
//       },
//       creator: {
//         select: {
//           id: true,
//           name: true,
//           email: true,
//         },
//       },
//     },
//   });

//   if (!post) {
//     throw notFound('Post not found');
//   }

//   return post;
// }

// async function getPosts(companyId, filters = {}) {
//   const { status, approvalStatus, page = 1, limit = 20 } = filters;

//   const where = { companyId };
//   if (status) where.contentStatus = status;
//   if (approvalStatus) where.approvalStatus = approvalStatus;

//   const skip = (page - 1) * limit;

//   const [posts, total] = await Promise.all([
//     prisma.post.findMany({
//       where,
//       include: {
//         targets: {
//           select: {
//             platform: true,
//             platformStatus: true,
//           },
//         },
//         _count: {
//           select: {
//             media: true,
//             publications: true,
//           },
//         },
//       },
//       orderBy: { createdAt: 'desc' },
//       skip,
//       take: limit,
//     }),
//     prisma.post.count({ where }),
//   ]);

//   return {
//     posts,
//     pagination: {
//       page,
//       limit,
//       total,
//       totalPages: Math.ceil(total / limit),
//     },
//   };
// }

// async function updatePost(id, companyId, data, actorId) {
//   const existingPost = await prisma.post.findFirst({
//     where: { id, companyId },
//     include: { targets: true },
//   });

//   if (!existingPost) {
//     throw notFound('Post not found');
//   }

//   const updateData = {};
//   if (data.globalMediaMode) updateData.globalMediaMode = data.globalMediaMode;
//   if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
//   if (data.timezone) updateData.timezone = data.timezone;

//   if (data.targets) {
//     await prisma.postTarget.deleteMany({ where: { postId: id } });
//     await prisma.postTarget.createMany({
//       data: data.targets.map((t) => ({
//         postId: id,
//         platform: t.platform,
//         socialAccountId: t.socialAccountId,
//         caption: t.caption,
//         title: t.title,
//         description: t.description,
//         hashtags: t.hashtags,
//         keywords: t.keywords,
//         thumbnailUrl: t.thumbnailUrl,
//         platformMetadata: t.platformMetadata,
//       })),
//     });
//   }

//   const post = await prisma.post.update({
//     where: { id },
//     data: updateData,
//     include: { targets: true },
//   });

//   if (post.approvalStatus === 'APPROVED') {
//     await prisma.post.update({
//       where: { id },
//       data: { approvalStatus: 'PENDING' },
//     });
//   }

//   const latestVersion = await prisma.postVersion.findFirst({
//     where: { postId: id },
//     orderBy: { versionNumber: 'desc' },
//   });

//   await createPostVersion(id, (latestVersion?.versionNumber || 0) + 1, actorId);

//   await logAudit({
//     actorId,
//     companyId,
//     action: 'POST_UPDATED',
//     targetType: 'Post',
//     targetId: id,
//     result: 'SUCCESS',
//   });

//   return post;
// }

// async function deletePost(id, companyId, actorId) {
//   const post = await prisma.post.findFirst({
//     where: { id, companyId },
//   });

//   if (!post) {
//     throw notFound('Post not found');
//   }

//   await prisma.post.delete({ where: { id } });

//   await logAudit({
//     actorId,
//     companyId,
//     action: 'POST_DELETED',
//     targetType: 'Post',
//     targetId: id,
//     result: 'SUCCESS',
//   });

//   return { success: true };
// }

// async function createPostVersion(postId, versionNumber, createdById) {
//   const post = await prisma.post.findUnique({
//     where: { id: postId },
//     include: { targets: true },
//   });

//   const snapshot = {
//     globalMediaMode: post.globalMediaMode,
//     scheduledAt: post.scheduledAt,
//     timezone: post.timezone,
//     targets: post.targets.map((t) => ({
//       platform: t.platform,
//       socialAccountId: t.socialAccountId,
//       caption: t.caption,
//       title: t.title,
//       description: t.description,
//       hashtags: t.hashtags,
//       keywords: t.keywords,
//       thumbnailUrl: t.thumbnailUrl,
//       platformMetadata: t.platformMetadata,
//     })),
//   };

//   return prisma.postVersion.create({
//     data: {
//       postId,
//       versionNumber,
//       contentSnapshot: snapshot,
//       createdById,
//     },
//   });
// }

// async function submitForApproval(id, companyId, actorId) {
//   const post = await prisma.post.findFirst({
//     where: { id, companyId },
//   });

//   if (!post) {
//     throw notFound('Post not found');
//   }

//   await prisma.post.update({
//     where: { id },
//     data: { approvalStatus: 'PENDING' },
//   });

//   await logAudit({
//     actorId,
//     companyId,
//     action: 'POST_SUBMITTED_FOR_APPROVAL',
//     targetType: 'Post',
//     targetId: id,
//     result: 'SUCCESS',
//   });

//   return { success: true };
// }

// async function approvePost(id, companyId, actorId) {
//   const post = await prisma.post.findFirst({
//     where: { id, companyId },
//   });

//   if (!post) {
//     throw notFound('Post not found');
//   }

//   await prisma.post.update({
//     where: { id },
//     data: { approvalStatus: 'APPROVED' },
//   });

//   await logAudit({
//     actorId,
//     companyId,
//     action: 'POST_APPROVED',
//     targetType: 'Post',
//     targetId: id,
//     result: 'SUCCESS',
//   });

//   return { success: true };
// }

// async function rejectPost(id, companyId, actorId) {
//   const post = await prisma.post.findFirst({
//     where: { id, companyId },
//   });

//   if (!post) {
//     throw notFound('Post not found');
//   }

//   await prisma.post.update({
//     where: { id },
//     data: { approvalStatus: 'REJECTED' },
//   });

//   await logAudit({
//     actorId,
//     companyId,
//     action: 'POST_REJECTED',
//     targetType: 'Post',
//     targetId: id,
//     result: 'SUCCESS',
//   });

//   return { success: true };
// }

// module.exports = {
//   createPost,
//   getPost,
//   getPosts,
//   updatePost,
//   deletePost,
//   submitForApproval,
//   approvePost,
//   rejectPost,
// };


const prisma = require('../utils/prisma');
const { badRequest, notFound, forbidden } = require('../utils/errors');
const { validatePlatform } = require('../utils/validation');
const { logAudit } = require('./auditService');

async function createPost(creatorId, data) {
  const { targets, globalMediaMode, scheduledAt, timezone } = data;

  if (!targets || !Array.isArray(targets) || targets.length === 0) {
    throw badRequest('At least one platform target is required');
  }

  for (const target of targets) {
    if (!validatePlatform(target.platform)) {
      throw badRequest(`Invalid platform: ${target.platform}`);
    }
    if (!target.socialAccountId) {
      throw badRequest(`Social account ID is required for platform: ${target.platform}`);
    }
  }

  // Group targets by company (derive companyId from social accounts)
  const socialAccountIds = [...new Set(targets.map((t) => t.socialAccountId))];
  const socialAccounts = await prisma.socialAccount.findMany({
    where: { id: { in: socialAccountIds } },
    select: { id: true, companyId: true },
  });

  const accountCompanyMap = {};
  for (const sa of socialAccounts) {
    accountCompanyMap[sa.id] = sa.companyId;
  }

  // Group targets by companyId
  const targetsByCompany = {};
  for (const target of targets) {
    const companyId = accountCompanyMap[target.socialAccountId];
    if (!companyId) {
      throw badRequest(`Social account ${target.socialAccountId} not found`);
    }
    if (!targetsByCompany[companyId]) {
      targetsByCompany[companyId] = [];
    }
    targetsByCompany[companyId].push(target);
  }

  // Create one post per company
  const createdPosts = [];
  for (const [companyId, companyTargets] of Object.entries(targetsByCompany)) {
    const post = await prisma.post.create({
      data: {
        companyId,
        creatorId,
        contentStatus: 'DRAFT',
        approvalStatus: 'NOT_REQUIRED',
        globalMediaMode: globalMediaMode || 'INTELLIGENT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        timezone,
        targets: {
          create: companyTargets.map((t) => ({
            platform: t.platform,
            socialAccountId: t.socialAccountId,
            caption: t.caption,
            title: t.title,
            description: t.description,
            hashtags: t.hashtags,
            keywords: t.keywords,
            thumbnailUrl: t.thumbnailUrl,
            platformMetadata: t.platformMetadata,
          })),
        },
      },
      include: { targets: true },
    });

    await createPostVersion(post.id, 1, creatorId);

    await logAudit({
      actorId: creatorId,
      companyId,
      action: 'POST_CREATED',
      targetType: 'Post',
      targetId: post.id,
      result: 'SUCCESS',
    });

    createdPosts.push(post);
  }

  return createdPosts.length === 1 ? createdPosts[0] : createdPosts;
}

async function getPost(id, companyId) {
  const where = { id };
  if (companyId) where.companyId = companyId;

  const post = await prisma.post.findFirst({
    where,
    include: {
      targets: {
        include: {
          socialAccount: {
            select: { id: true, platform: true, accountName: true, status: true },
          },
        },
      },
      media: { include: { variants: true } },
      publications: {
        include: { targets: true },
        orderBy: { createdAt: 'desc' },
      },
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  if (!post) throw notFound('Post not found');
  return post;
}

async function getPosts(companyId, filters = {}) {
  const { status, approvalStatus, page = 1, limit = 20 } = filters;
  const where = {};
  if (companyId) where.companyId = companyId;
  if (status) where.contentStatus = status;
  if (approvalStatus) where.approvalStatus = approvalStatus;

  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        targets: { select: { platform: true, platformStatus: true } },
        company: { select: { id: true, name: true } },
        _count: { select: { media: true, publications: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function updatePost(id, companyId, data, actorId) {
  const where = { id };
  if (companyId) where.companyId = companyId;

  const existingPost = await prisma.post.findFirst({ where, include: { targets: true } });
  if (!existingPost) throw notFound('Post not found');

  const updateData = {};
  if (data.globalMediaMode) updateData.globalMediaMode = data.globalMediaMode;
  if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
  if (data.timezone) updateData.timezone = data.timezone;

  if (data.targets) {
    await prisma.postTarget.deleteMany({ where: { postId: id } });
    await prisma.postTarget.createMany({
      data: data.targets.map((t) => ({
        postId: id,
        platform: t.platform,
        socialAccountId: t.socialAccountId,
        caption: t.caption,
        title: t.title,
        description: t.description,
        hashtags: t.hashtags,
        keywords: t.keywords,
        thumbnailUrl: t.thumbnailUrl,
        platformMetadata: t.platformMetadata,
      })),
    });
  }

  const post = await prisma.post.update({
    where: { id },
    data: updateData,
    include: { targets: true },
  });

  if (post.approvalStatus === 'APPROVED') {
    await prisma.post.update({ where: { id }, data: { approvalStatus: 'PENDING' } });
  }

  const latestVersion = await prisma.postVersion.findFirst({
    where: { postId: id },
    orderBy: { versionNumber: 'desc' },
  });
  await createPostVersion(id, (latestVersion?.versionNumber || 0) + 1, actorId);

  await logAudit({
    actorId,
    companyId: existingPost.companyId,
    action: 'POST_UPDATED',
    targetType: 'Post',
    targetId: id,
    result: 'SUCCESS',
  });

  return post;
}

async function deletePost(id, companyId, actorId) {
  const where = { id };
  if (companyId) where.companyId = companyId;

  const post = await prisma.post.findFirst({ where });
  if (!post) throw notFound('Post not found');

  await prisma.post.delete({ where: { id } });

  await logAudit({
    actorId,
    companyId: post.companyId,
    action: 'POST_DELETED',
    targetType: 'Post',
    targetId: id,
    result: 'SUCCESS',
  });

  return { success: true };
}

async function createPostVersion(postId, versionNumber, createdById) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { targets: true },
  });

  const snapshot = {
    globalMediaMode: post.globalMediaMode,
    scheduledAt: post.scheduledAt,
    timezone: post.timezone,
    targets: post.targets.map((t) => ({
      platform: t.platform,
      socialAccountId: t.socialAccountId,
      caption: t.caption,
      title: t.title,
      description: t.description,
      hashtags: t.hashtags,
      keywords: t.keywords,
      thumbnailUrl: t.thumbnailUrl,
      platformMetadata: t.platformMetadata,
    })),
  };

  return prisma.postVersion.create({
    data: { postId, versionNumber, contentSnapshot: snapshot, createdById },
  });
}

async function submitForApproval(id, companyId, actorId) {
  const where = { id };
  if (companyId) where.companyId = companyId;

  const post = await prisma.post.findFirst({ where });
  if (!post) throw notFound('Post not found');

  await prisma.post.update({ where: { id }, data: { approvalStatus: 'PENDING' } });

  await logAudit({ actorId, companyId: post.companyId, action: 'POST_SUBMITTED_FOR_APPROVAL', targetType: 'Post', targetId: id, result: 'SUCCESS' });
  return { success: true };
}

async function approvePost(id, companyId, actorId) {
  const where = { id };
  if (companyId) where.companyId = companyId;

  const post = await prisma.post.findFirst({ where });
  if (!post) throw notFound('Post not found');

  await prisma.post.update({ where: { id }, data: { approvalStatus: 'APPROVED' } });
  await logAudit({ actorId, companyId: post.companyId, action: 'POST_APPROVED', targetType: 'Post', targetId: id, result: 'SUCCESS' });
  return { success: true };
}

async function rejectPost(id, companyId, actorId) {
  const where = { id };
  if (companyId) where.companyId = companyId;

  const post = await prisma.post.findFirst({ where });
  if (!post) throw notFound('Post not found');

  await prisma.post.update({ where: { id }, data: { approvalStatus: 'REJECTED' } });
  await logAudit({ actorId, companyId: post.companyId, action: 'POST_REJECTED', targetType: 'Post', targetId: id, result: 'SUCCESS' });
  return { success: true };
}

module.exports = {
  createPost,
  getPost,
  getPosts,
  updatePost,
  deletePost,
  submitForApproval,
  approvePost,
  rejectPost,
};
