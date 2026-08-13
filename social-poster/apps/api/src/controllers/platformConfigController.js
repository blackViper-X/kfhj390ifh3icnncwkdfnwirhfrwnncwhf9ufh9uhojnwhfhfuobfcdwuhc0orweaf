const platformConfigService = require('../services/platformConfigService');

async function getPlatformConfigs(req, res, next) {
  try {
    const configs = await platformConfigService.getPlatformConfigs(req.params.id);
    res.json({ success: true, data: configs });
  } catch (error) {
    next(error);
  }
}

async function createOrUpdatePlatformConfig(req, res, next) {
  try {
    const config = await platformConfigService.createOrUpdatePlatformConfig(
      req.params.id,
      req.body,
      req.user.id
    );
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
}

async function deletePlatformConfig(req, res, next) {
  try {
    await platformConfigService.deletePlatformConfig(req.params.id, req.params.platform, req.user.id);
    res.json({ success: true, message: 'Platform configuration deleted' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPlatformConfigs,
  createOrUpdatePlatformConfig,
  deletePlatformConfig,
};
