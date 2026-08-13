const { Worker } = require('bullmq');
const { connection } = require('../queues');
const { processMedia } = require('../services/mediaService');
const logger = require('../utils/logger');

async function processMediaJob(job) {
  const { mediaId, companyId, options } = job.data;

  logger.info('Processing media job', { mediaId, jobId: job.id });

  await processMedia(mediaId, companyId, options);

  logger.info('Media job completed', { mediaId, jobId: job.id });
}

const mediaWorker = new Worker('media.process', processMediaJob, {
  connection,
  concurrency: 3,
});

mediaWorker.on('completed', (job) => {
  logger.info('Media job completed', { jobId: job.id });
});

mediaWorker.on('failed', (job, err) => {
  logger.error('Media job failed', { jobId: job.id, error: err.message });
});

module.exports = mediaWorker;
