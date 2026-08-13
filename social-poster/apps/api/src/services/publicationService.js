const prisma = require('../utils/prisma');
const { notFound, badRequest, forbidden } = require('../utils/errors');
const { logAudit } = require('./auditService');
const logger = require('../utils/logger');

async function createPublication(postId, actorId) {
  const post = await prisma.post.findFirst({
    where: { id: postId },
    include: {
      targets: true,
    },
  });

  if (!post) {
    throw notFound('Post not found');
  }

  if (post.approvalStatus === 'PENDING') {
    throw forbidden('Post is pending approval');
  }

  if (post.approvalStatus === 'REJECTED') {
    throw forbidden('Post has been rejected');
  }
  const companyId = post.companyId;

  const publication = await prisma.publication.create({
    data: {
      postId,
      companyId,
      status: 'PENDING',
      createdById: actorId,
      targets: {
        create: post.targets.map((target) => ({
          postTargetId: target.id,
          platform: target.platform,
          socialAccountId: target.socialAccountId,
          status: 'PENDING',
          idempotencyKey: `${postId}-${target.platform}-${Date.now()}`,
        })),
      },
    },
    include: {
      targets: true,
    },
  });

  await prisma.post.update({
    where: { id: postId },
    data: { contentStatus: 'PUBLISHING' },
  });

  await logAudit({
    actorId,
    companyId,
    action: 'PUBLICATION_CREATED',
    targetType: 'Publication',
    targetId: publication.id,
    result: 'SUCCESS',
  });

  return publication;
}

async function getPublication(id, companyId) {
  const publication = await prisma.publication.findFirst({
    where: { id, companyId },
    include: {
      targets: {
        include: {
          socialAccount: {
            select: {
              id: true,
              platform: true,
              accountName: true,
              status: true,
            },
          },
          attempts_history: {
            orderBy: { createdAt: 'desc' },
          },
        },
      },
      post: {
        select: {
          id: true,
          contentStatus: true,
          approvalStatus: true,
        },
      },
    },
  });

  if (!publication) {
    throw notFound('Publication not found');
  }

  return publication;
}

async function updatePublicationTargetStatus(targetId, status, data = {}) {
  await prisma.publicationTarget.update({
    where: { id: targetId },
    data: {
      status,
      ...data,
    },
  });

  await updateParentPublicationStatus(targetId);
}

async function updateParentPublicationStatus(targetId) {
  const target = await prisma.publicationTarget.findUnique({
    where: { id: targetId },
    include: {
      publication: {
        include: {
          targets: true,
        },
      },
    },
  });

  if (!target) return;

  const { publication } = target;
  const allTargets = publication.targets;

  const allPublished = allTargets.every((t) => t.status === 'PUBLISHED');
  const allFailed = allTargets.every((t) => t.status === 'FAILED');
  const somePublished = allTargets.some((t) => t.status === 'PUBLISHED');
  const someFailed = allTargets.some((t) => t.status === 'FAILED');

  let newStatus = publication.status;

  if (allPublished) {
    newStatus = 'PUBLISHED';
  } else if (allFailed) {
    newStatus = 'FAILED';
  } else if (somePublished && someFailed) {
    newStatus = 'PARTIALLY_PUBLISHED';
  }

  await prisma.publication.update({
    where: { id: publication.id },
    data: {
      status: newStatus,
      publishedAt: allPublished ? new Date() : null,
    },
  });

  const postStatus = allPublished ? 'PUBLISHED' : allFailed ? 'FAILED' : somePublished ? 'PARTIALLY_PUBLISHED' : 'PUBLISHING';

  await prisma.post.update({
    where: { id: publication.postId },
    data: { contentStatus: postStatus },
  });
}

async function recordPublishingAttempt(targetId, status, errorMessage, externalPostId) {
  const target = await prisma.publicationTarget.findUnique({
    where: { id: targetId },
  });

  if (!target) {
    throw notFound('Publication target not found');
  }

  await prisma.publishingAttempt.create({
    data: {
      publicationTargetId: targetId,
      attemptNumber: target.attempts + 1,
      status,
      errorMessage,
      externalPostId,
    },
  });

  await prisma.publicationTarget.update({
    where: { id: targetId },
    data: {
      attempts: { increment: 1 },
    },
  });
}

async function retryPublication(publicationId, companyId, actorId) {
  const publication = await prisma.publication.findFirst({
    where: { id: publicationId, companyId },
    include: {
      targets: {
        where: { status: 'FAILED' },
      },
    },
  });

  if (!publication) {
    throw notFound('Publication not found');
  }

  if (publication.targets.length === 0) {
    throw badRequest('No failed targets to retry');
  }

  for (const target of publication.targets) {
    await prisma.publicationTarget.update({
      where: { id: target.id },
      data: {
        status: 'PENDING',
        errorMessage: null,
      },
    });
  }

  await logAudit({
    actorId,
    companyId,
    action: 'PUBLICATION_RETRIED',
    targetType: 'Publication',
    targetId: publicationId,
    result: 'SUCCESS',
  });

  return publication;
}

async function cancelPublication(publicationId, companyId, actorId) {
  const publication = await prisma.publication.findFirst({
    where: { id: publicationId, companyId },
  });

  if (!publication) {
    throw notFound('Publication not found');
  }

  await prisma.publication.update({
    where: { id: publicationId },
    data: { status: 'CANCELLED' },
  });

  await prisma.publicationTarget.updateMany({
    where: { publicationId },
    data: { status: 'CANCELLED' },
  });

  await logAudit({
    actorId,
    companyId,
    action: 'PUBLICATION_CANCELLED',
    targetType: 'Publication',
    targetId: publicationId,
    result: 'SUCCESS',
  });

  return { success: true };
}

module.exports = {
  createPublication,
  getPublication,
  updatePublicationTargetStatus,
  recordPublishingAttempt,
  retryPublication,
  cancelPublication,
};
