const express = require('express');
const prisma = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');
const { notFound } = require('../utils/errors');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    let companyId;
    if (req.user.systemRole === 'SUPERUSER') {
      companyId = req.query.companyId;
    } else {
      const membership = await prisma.companyMembership.findFirst({
        where: { userId: req.user.id },
      });
      companyId = membership?.companyId;
    }

    if (!companyId) {
      return res.json({ success: true, data: [] });
    }

    const comments = await prisma.comment.findMany({
      where: { companyId },
      include: {
        socialAccount: { select: { platform: true, accountName: true } },
        postTarget: { select: { platform: true, externalPostId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/reply', async (req, res, next) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.id },
      include: { socialAccount: true },
    });

    if (!comment) {
      throw notFound('Comment not found');
    }

    const { getAdapter } = require('../adapters/social');
    const { getDecryptedOAuthCredential } = require('../services/socialAccountService');
    const oauth = await getDecryptedOAuthCredential(comment.socialAccountId);
    const adapter = getAdapter(comment.platform);

    const result = await adapter.replyToComment({
      accessToken: oauth.accessToken,
      commentId: comment.externalCommentId,
      message: req.body.message,
    });

    await prisma.comment.update({
      where: { id: comment.id },
      data: {
        replyStatus: 'REPLIED',
        replyContent: req.body.message,
      },
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
