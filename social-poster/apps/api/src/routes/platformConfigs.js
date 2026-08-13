const express = require('express');
const platformConfigController = require('../controllers/platformConfigController');
const { authenticate, requireRole, requireCompanyAccess } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get('/:id/platform-configs', requireCompanyAccess, platformConfigController.getPlatformConfigs);
router.post('/:id/platform-configs', requireRole('SUPERUSER'), requireCompanyAccess, platformConfigController.createOrUpdatePlatformConfig);
router.delete('/:id/platform-configs/:platform', requireRole('SUPERUSER'), requireCompanyAccess, platformConfigController.deletePlatformConfig);

module.exports = router;
