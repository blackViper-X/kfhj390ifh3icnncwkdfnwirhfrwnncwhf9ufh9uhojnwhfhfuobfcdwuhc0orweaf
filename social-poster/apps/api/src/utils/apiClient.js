// const axios = require('axios');
// const logger = require('./logger');

// const DEFAULT_TIMEOUT = 30000;
// const MAX_RETRIES = 3;
// const BASE_DELAY = 1000;

// async function makeRequest(config) {
//   const { url, method = 'GET', headers = {}, data, params, timeout = DEFAULT_TIMEOUT, retries = MAX_RETRIES } = config;

//   let attempt = 0;
//   let lastError = null;

//   while (attempt <= retries) {
//     try {
//       const response = await axios({
//         url,
//         method,
//         headers,
//         data,
//         params,
//         timeout,
//         validateStatus: (status) => status < 500 && status !== 429,
//       });

//       return response;
//     } catch (error) {
//       lastError = error;
//       attempt++;

//       const status = error.response?.status;
//       const isRetryable = !status || status >= 500 || status === 429;

//       if (!isRetryable || attempt > retries) {
//         logger.error('API request failed', {
//           url,
//           method,
//           status,
//           message: error.message,
//           attempt,
//         });
//         throw error;
//       }

//       let delay = BASE_DELAY * Math.pow(2, attempt - 1);

//       if (status === 429) {
//         const retryAfter = error.response?.headers?.['retry-after'];
//         if (retryAfter) {
//           delay = parseInt(retryAfter, 10) * 1000;
//         }
//       }

//       logger.warn('API request retrying', {
//         url,
//         method,
//         status,
//         attempt,
//         delay,
//       });

//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }

//   throw lastError;
// }

// module.exports = {
//   makeRequest,
// };


const axios = require('axios');
const logger = require('./logger');

const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

/**
 * Pull a human-readable message out of a platform error body.
 * Each provider shapes errors differently:
 *   Facebook/Instagram -> { error: { message, type, code, error_subcode } }
 *   Google/YouTube     -> { error: "invalid_grant", error_description: "..." }
 *                      -> { error: { code, message, errors: [...] } }
 *   Pinterest          -> { message } | { error, error_description }
 */
function extractPlatformError(body) {
  if (!body) return null;
  if (typeof body === 'string') return body.slice(0, 500);

  if (body.error && typeof body.error === 'object') {
    const e = body.error;
    const parts = [e.message || e.error_user_msg];
    if (e.type) parts.push(`type=${e.type}`);
    if (e.code !== undefined) parts.push(`code=${e.code}`);
    if (e.error_subcode !== undefined) parts.push(`subcode=${e.error_subcode}`);
    const msg = parts.filter(Boolean).join(' ');
    if (msg) return msg;
  }

  if (typeof body.error === 'string') {
    return [body.error, body.error_description].filter(Boolean).join(': ');
  }

  if (body.message) return body.message;

  try {
    return JSON.stringify(body).slice(0, 500);
  } catch {
    return null;
  }
}

function buildHttpError({ url, method, status, body }) {
  const detail = extractPlatformError(body);
  const error = new Error(
    `${method} ${url} failed with HTTP ${status}${detail ? `: ${detail}` : ''}`
  );
  error.status = status;
  error.responseBody = body;
  error.isPlatformError = true;
  return error;
}

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
        // Only 2xx/3xx count as success. 4xx used to be swallowed here, which
        // let error bodies flow downstream as if they were valid payloads and
        // surfaced later as confusing "undefined" errors.
        validateStatus: (status) => status < 400,
      });

      return response;
    } catch (error) {
      lastError = error;
      attempt++;

      const status = error.response?.status;
      const isRetryable = !status || status >= 500 || status === 429;

      if (!isRetryable || attempt > retries) {
        const body = error.response?.data;
        logger.error('API request failed', {
          url,
          method,
          status,
          message: error.message,
          platformError: extractPlatformError(body),
          attempt,
        });

        // Non-2xx responses become descriptive errors carrying the provider's
        // own message, so callers see "invalid_grant: code expired" rather
        // than a downstream TypeError about undefined.
        if (status) {
          throw buildHttpError({ url, method, status, body });
        }
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
