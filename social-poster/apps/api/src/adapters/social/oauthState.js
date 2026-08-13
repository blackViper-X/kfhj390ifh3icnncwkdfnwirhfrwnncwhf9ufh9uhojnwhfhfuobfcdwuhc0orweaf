const crypto = require('crypto');
const config = require('../../config');

function generateOAuthState(companyId, platform) {
  const payload = JSON.stringify({ companyId, platform, timestamp: Date.now() });
  const hmac = crypto.createHmac('sha256', config.jwtSecret);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64url');
}

function verifyOAuthState(state) {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    const { payload, signature } = decoded;

    const hmac = crypto.createHmac('sha256', config.jwtSecret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Invalid state signature');
    }

    const data = JSON.parse(payload);
    const age = Date.now() - data.timestamp;
    if (age > 600000) {
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
