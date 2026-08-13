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

    const conversations = await prisma.conversation.findMany({
      where: { companyId },
      include: {
        socialAccount: { select: { platform: true, accountName: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    res.json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/messages', async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
    });

    if (!conversation) {
      throw notFound('Conversation not found');
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.id },
      orderBy: { timestamp: 'asc' },
    });

    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/messages', async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: { socialAccount: true },
    });

    if (!conversation) {
      throw notFound('Conversation not found');
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: req.user.name,
        isFromPage: true,
        content: req.body.content,
      },
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
