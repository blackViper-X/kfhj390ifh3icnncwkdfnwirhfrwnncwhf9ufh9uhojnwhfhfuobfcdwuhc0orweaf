const express = require('express');
const mediaController = require('../controllers/mediaController');
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

router.post('/upload', mediaController.upload.single('file'), mediaController.uploadMedia);
router.get('/:id', mediaController.getMedia);
router.post('/:id/process', mediaController.processMedia);
router.delete('/:id', mediaController.deleteMedia);

module.exports = router;
