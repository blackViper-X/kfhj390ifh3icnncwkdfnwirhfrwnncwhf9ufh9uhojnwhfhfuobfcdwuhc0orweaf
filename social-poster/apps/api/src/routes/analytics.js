const express = require('express');
const prisma = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');

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

    const analytics = await prisma.analyticsSnapshot.findMany({
      where: { companyId },
      orderBy: { snapshotDate: 'desc' },
      take: 30,
    });

    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
});

router.get('/companies/:id', async (req, res, next) => {
  try {
    const analytics = await prisma.analyticsSnapshot.findMany({
      where: { companyId: req.params.id },
      orderBy: { snapshotDate: 'desc' },
    });

    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
});

router.get('/posts/:id', async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        targets: {
          select: {
            platform: true,
            externalPostId: true,
            platformStatus: true,
          },
        },
      },
    });

    res.json({ success: true, data: post?.targets || [] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
