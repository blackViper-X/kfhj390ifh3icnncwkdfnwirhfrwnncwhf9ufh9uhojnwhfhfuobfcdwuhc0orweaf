const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const config = require('../config');

const connection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

const mediaProcessQueue = new Queue('media.process', { connection });
const mediaCleanupQueue = new Queue('media.cleanup', { connection });
const postPublishQueue = new Queue('post.publish', { connection });
const postScheduleQueue = new Queue('post.schedule', { connection });
const analyticsSyncQueue = new Queue('analytics.sync', { connection });
const commentsSyncQueue = new Queue('comments.sync', { connection });
const messagesSyncQueue = new Queue('messages.sync', { connection });
const tokenRefreshQueue = new Queue('token.refresh', { connection });
const webhookProcessQueue = new Queue('webhook.process', { connection });

module.exports = {
  connection,
  mediaProcessQueue,
  mediaCleanupQueue,
  postPublishQueue,
  postScheduleQueue,
  analyticsSyncQueue,
  commentsSyncQueue,
  messagesSyncQueue,
  tokenRefreshQueue,
  webhookProcessQueue,
};
