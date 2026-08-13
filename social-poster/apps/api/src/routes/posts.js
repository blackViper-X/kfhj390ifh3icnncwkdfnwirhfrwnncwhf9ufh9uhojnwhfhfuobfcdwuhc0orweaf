const express = require('express');
const postController = require('../controllers/postController');
const { authenticate, requireCompanyAccess } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

function companyMiddleware(req, res, next) {
  if (req.user.systemRole === 'SUPERUSER') {
    if (req.query.companyId) {
      req.companyId = req.query.companyId;
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

router.post('/', postController.createPost);
router.get('/', postController.getPosts);
router.get('/:id', postController.getPost);
router.patch('/:id', postController.updatePost);
router.delete('/:id', postController.deletePost);
router.post('/:id/submit-approval', postController.submitForApproval);
router.post('/:id/approve', postController.approvePost);
router.post('/:id/reject', postController.rejectPost);

module.exports = router;
