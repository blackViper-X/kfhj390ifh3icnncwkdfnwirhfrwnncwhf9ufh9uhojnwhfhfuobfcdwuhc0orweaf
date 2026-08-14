// const crypto = require('crypto');
// const config = require('../config');

// const ALGORITHM = 'aes-256-gcm';

// function encrypt(text) {
//   const iv = crypto.randomBytes(16);
//   const key = Buffer.from(config.encryptionKey, 'hex');
//   const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

//   let encrypted = cipher.update(text, 'utf8', 'hex');
//   encrypted += cipher.final('hex');

//   const authTag = cipher.getAuthTag();

//   return {
//     encrypted,
//     iv: iv.toString('hex'),
//     authTag: authTag.toString('hex'),
//   };
// }

// function decrypt(encrypted, iv, authTag) {
//   const key = Buffer.from(config.encryptionKey, 'hex');
//   const decipher = crypto.createDecipheriv(
//     ALGORITHM,
//     key,
//     Buffer.from(iv, 'hex')
//   );

//   decipher.setAuthTag(Buffer.from(authTag, 'hex'));

//   let decrypted = decipher.update(encrypted, 'hex', 'utf8');
//   decrypted += decipher.final('utf8');

//   return decrypted;
// }

// module.exports = {
//   encrypt,
//   decrypt,
// };


const crypto = require('crypto');
const config = require('../config');

const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const key = Buffer.from(config.encryptionKey, 'hex');
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be a 64-character hex string (32 bytes); got ${key.length} bytes. ` +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return key;
}

function encrypt(text) {
  // Fail loudly and descriptively instead of letting Cipheriv.update() throw
  // an opaque ERR_INVALID_ARG_TYPE far away from the real cause.
  if (typeof text !== 'string' || text.length === 0) {
    throw new TypeError(
      `encrypt() expects a non-empty string, received ${text === null ? 'null' : typeof text}. ` +
      'This usually means an upstream OAuth token exchange returned no token.'
    );
  }

  const iv = crypto.randomBytes(16);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

function decrypt(encrypted, iv, authTag) {
  const key = Buffer.from(config.encryptionKey, 'hex');
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypt into a single self-describing string: "v1:<iv>:<authTag>:<ciphertext>".
 *
 * Used where the schema has no dedicated iv/authTag columns for the value
 * (e.g. OAuthCredential.encryptedRefreshToken). Reusing another value's IV
 * would silently corrupt decryption, so the parameters travel with the payload.
 */
function encryptToString(text) {
  const { encrypted, iv, authTag } = encrypt(text);
  return `v1:${iv}:${authTag}:${encrypted}`;
}

function decryptFromString(payload) {
  if (typeof payload !== 'string' || payload.length === 0) {
    throw new TypeError('decryptFromString() expects a non-empty string');
  }

  const parts = payload.split(':');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Malformed encrypted payload; expected "v1:<iv>:<authTag>:<ciphertext>"');
  }

  const [, iv, authTag, encrypted] = parts;
  return decrypt(encrypted, iv, authTag);
}

function isPackedPayload(value) {
  return typeof value === 'string' && value.startsWith('v1:') && value.split(':').length === 4;
}

module.exports = {
  encrypt,
  decrypt,
  encryptToString,
  decryptFromString,
  isPackedPayload,
};
