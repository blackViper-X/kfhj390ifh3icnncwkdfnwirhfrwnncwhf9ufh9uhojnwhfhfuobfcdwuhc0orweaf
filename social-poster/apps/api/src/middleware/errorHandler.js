const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Error occurred', {
    message: err.message,
    code: err.code,
    status: err.status,
    stack: err.stack,
    requestId: req.requestId,
    userId: req.user?.id,
    companyId: req.companyId,
  });

  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'INTERNAL_ERROR';

  if (status === 500 && process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }

  res.status(status).json({
    success: false,
    message,
    code,
  });
}

module.exports = errorHandler;
