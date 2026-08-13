const express = require('express');
const crypto = require('crypto');
const prisma = require('../utils/prisma');
const { webhookProcessQueue } = require('../queues');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/:platform', async (req, res) => {
  const { platform } = req.params;
  const { 'hub.mode': mode, 'hub.verify_token': verifyToken, 'hub.challenge': challenge } = req.query;

  if (platform === 'FACEBOOK' || platform === 'INSTAGRAM') {
    if (mode === 'subscribe' && verifyToken === process.env.WEBHOOK_VERIFY_TOKEN) {
      return res.send(challenge);
    }
    return res.sendStatus(403);
  }

  res.sendStatus(200);
});

router.post('/:platform', async (req, res, next) => {
  try {
    const { platform } = req.params;
    const signature = req.headers['x-hub-signature-256'] || req.headers['x-pinterest-signature'];

    const eventId = crypto.randomUUID();

    await prisma.webhookEvent.create({
      data: {
        platform,
        externalId: eventId,
        payload: req.body,
      },
    });

    await webhookProcessQueue.add('process', {
      eventId,
      platform,
      payload: req.body,
    });

    res.sendStatus(200);
  } catch (error) {
    if (error.code === 'P2002') {
      logger.info('Duplicate webhook event', { platform });
      return res.sendStatus(200);
    }
    logger.error('Webhook processing failed', { error: error.message });
    res.sendStatus(500);
  }
});

module.exports = router;
