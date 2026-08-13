const logger = require('./utils/logger');

require('./workers/publishWorker');
require('./workers/mediaWorker');

logger.info('Workers started');

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down workers');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down workers');
  process.exit(0);
});
