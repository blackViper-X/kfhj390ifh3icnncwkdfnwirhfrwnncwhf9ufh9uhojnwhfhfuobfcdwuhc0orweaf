const axios = require('axios');
const logger = require('./logger');

const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

async function makeRequest(config) {
  const { url, method = 'GET', headers = {}, data, params, timeout = DEFAULT_TIMEOUT, retries = MAX_RETRIES } = config;

  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    try {
      const response = await axios({
        url,
        method,
        headers,
        data,
        params,
        timeout,
        validateStatus: (status) => status < 500 && status !== 429,
      });

      return response;
    } catch (error) {
      lastError = error;
      attempt++;

      const status = error.response?.status;
      const isRetryable = !status || status >= 500 || status === 429;

      if (!isRetryable || attempt > retries) {
        logger.error('API request failed', {
          url,
          method,
          status,
          message: error.message,
          attempt,
        });
        throw error;
      }

      let delay = BASE_DELAY * Math.pow(2, attempt - 1);

      if (status === 429) {
        const retryAfter = error.response?.headers?.['retry-after'];
        if (retryAfter) {
          delay = parseInt(retryAfter, 10) * 1000;
        }
      }

      logger.warn('API request retrying', {
        url,
        method,
        status,
        attempt,
        delay,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

module.exports = {
  makeRequest,
};
