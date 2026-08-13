const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const storage = require('./utils/storage');

async function start() {
  try {
    await storage.ensureBucket();

    app.listen(config.port, '0.0.0.0', () => {
      logger.info('API server started', {
        port: config.port,
        env: config.nodeEnv,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

start();
