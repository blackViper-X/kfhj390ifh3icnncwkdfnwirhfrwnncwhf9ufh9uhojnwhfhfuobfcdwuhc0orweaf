const express = require('express');
const socialAccountController = require('../controllers/socialAccountController');
const { authenticate, requireCompanyAccess } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.get('/companies/:id/social-accounts', authenticate, requireCompanyAccess, socialAccountController.getSocialAccounts);
router.get('/companies/:id/social-accounts/:platform/connect', authenticate, requireCompanyAccess, socialAccountController.connectSocialAccount);
router.get('/social-accounts/oauth/callback', socialAccountController.oauthCallback);
router.post('/social-accounts/:id/disconnect', authenticate, socialAccountController.disconnectSocialAccount);

module.exports = router;
