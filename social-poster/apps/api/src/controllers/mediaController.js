const multer = require('multer');
const mediaService = require('../services/mediaService');
const { mediaProcessQueue } = require('../queues');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

async function uploadMedia(req, res, next) {
  try {
    const media = await mediaService.uploadMedia(req.companyId, req.body.postId, req.file);

    await mediaProcessQueue.add('process', {
      mediaId: media.id,
      companyId: req.companyId,
      options: JSON.parse(req.body.options || '{}'),
    });

    res.status(201).json({ success: true, data: media });
  } catch (error) {
    next(error);
  }
}

async function getMedia(req, res, next) {
  try {
    const media = await mediaService.getMedia(req.params.id, req.companyId);
    res.json({ success: true, data: media });
  } catch (error) {
    next(error);
  }
}

async function processMedia(req, res, next) {
  try {
    await mediaProcessQueue.add('process', {
      mediaId: req.params.id,
      companyId: req.companyId,
      options: req.body.options || {},
    });

    res.json({ success: true, message: 'Media processing queued' });
  } catch (error) {
    next(error);
  }
}

async function deleteMedia(req, res, next) {
  try {
    await mediaService.deleteMedia(req.params.id, req.companyId);
    res.json({ success: true, message: 'Media deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  upload,
  uploadMedia,
  getMedia,
  processMedia,
  deleteMedia,
};
