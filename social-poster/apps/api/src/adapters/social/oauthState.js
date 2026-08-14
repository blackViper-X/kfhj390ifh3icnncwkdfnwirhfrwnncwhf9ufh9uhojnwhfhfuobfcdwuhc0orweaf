// const crypto = require('crypto');
// const config = require('../../config');

// function generateOAuthState(companyId, platform) {
//   const payload = JSON.stringify({ companyId, platform, timestamp: Date.now() });
//   const hmac = crypto.createHmac('sha256', config.jwtSecret);
//   hmac.update(payload);
//   const signature = hmac.digest('hex');
//   return Buffer.from(JSON.stringify({ payload, signature })).toString('base64url');
// }

// function verifyOAuthState(state) {
//   try {
//     const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
//     const { payload, signature } = decoded;

//     const hmac = crypto.createHmac('sha256', config.jwtSecret);
//     hmac.update(payload);
//     const expectedSignature = hmac.digest('hex');

//     if (signature !== expectedSignature) {
//       throw new Error('Invalid state signature');
//     }

//     const data = JSON.parse(payload);
//     const age = Date.now() - data.timestamp;
//     if (age > 600000) {
//       throw new Error('State has expired');
//     }

//     return data;
//   } catch (error) {
//     throw new Error(`Invalid OAuth state: ${error.message}`);
//   }
// }

// module.exports = {
//   generateOAuthState,
//   verifyOAuthState,
// };


const crypto = require('crypto');
const config = require('../../config');

const STATE_TTL_MS = 600000; // 10 minutes

/**
 * The state parameter carries the tenant context across the OAuth redirect.
 * userId is included so the callback can attribute the audit log entry to a
 * real user (AuditLog.actorId is a foreign key to User, so a literal
 * "system" string would fail to insert).
 */
function generateOAuthState(companyId, platform, userId) {
  const payload = JSON.stringify({ companyId, platform, userId, timestamp: Date.now() });
  const hmac = crypto.createHmac('sha256', config.jwtSecret);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64url');
}

function verifyOAuthState(state) {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    const { payload, signature } = decoded;

    if (typeof payload !== 'string' || typeof signature !== 'string') {
      throw new Error('Malformed state payload');
    }

    const hmac = crypto.createHmac('sha256', config.jwtSecret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    // Constant-time compare to avoid leaking the signature byte by byte.
    const given = Buffer.from(signature, 'hex');
    const expected = Buffer.from(expectedSignature, 'hex');
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
      throw new Error('Invalid state signature');
    }

    const data = JSON.parse(payload);
    const age = Date.now() - data.timestamp;
    if (age > STATE_TTL_MS) {
      throw new Error('State has expired');
    }

    return data;
  } catch (error) {
    throw new Error(`Invalid OAuth state: ${error.message}`);
  }
}

module.exports = {
  generateOAuthState,
  verifyOAuthState,
};
