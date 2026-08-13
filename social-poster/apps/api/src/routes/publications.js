const express = require('express');
const publicationController = require('../controllers/publicationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

function companyMiddleware(req, res, next) {
  if (req.user.systemRole === 'SUPERUSER') {
    if (req.query.companyId || req.body.companyId) {
      req.companyId = req.query.companyId || req.body.companyId;
    }
    return next();
  }

  const prisma = require('../utils/prisma');
  prisma.companyMembership.findFirst({
    where: { userId: req.user.id },
  }).then((membership) => {
    if (!membership) {
      return res.status(403).json({ success: false, message: 'No company access', code: 'FORBIDDEN' });
    }
    req.companyId = membership.companyId;
    next();
  }).catch(next);
}

router.use(companyMiddleware);

router.post('/', publicationController.createPublication);
router.get('/:id', publicationController.getPublication);
router.post('/:id/retry', publicationController.retryPublication);
router.post('/:id/cancel', publicationController.cancelPublication);

module.exports = router;
