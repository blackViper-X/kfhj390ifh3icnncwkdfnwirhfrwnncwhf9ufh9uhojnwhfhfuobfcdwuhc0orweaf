const publicationService = require('../services/publicationService');
const { postPublishQueue, postScheduleQueue } = require('../queues');

async function createPublication(req, res, next) {
  try {
    const publication = await publicationService.createPublication(
      req.body.postId,
      req.user.id
    );

    for (const target of publication.targets) {
      await postPublishQueue.add('publish', {
        publicationTargetId: target.id,
      });
    }

    res.status(201).json({ success: true, data: publication });
  } catch (error) {
    next(error);
  }
}

async function getPublication(req, res, next) {
  try {
    const publication = await publicationService.getPublication(req.params.id, req.companyId);
    res.json({ success: true, data: publication });
    Agent

  } catch (error) {
    next(error);
  }
}

async function retryPublication(req, res, next) {
  try {
    const publication = await publicationService.retryPublication(
      req.params.id,
      req.companyId,
      req.user.id
    );

    for (const target of publication.targets) {
      if (target.status === 'FAILED') {
        await postPublishQueue.add('publish', {
          publicationTargetId: target.id,
        });
      }
    }

    res.json({ success: true, message: 'Retry initiated' });
  } catch (error) {
    next(error);
  }
}

async function cancelPublication(req, res, next) {
  try {
    await publicationService.cancelPublication(req.params.id, req.companyId, req.user.id);
    res.json({ success: true, message: 'Publication cancelled' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPublication,
  getPublication,
  retryPublication,
  cancelPublication,
};
