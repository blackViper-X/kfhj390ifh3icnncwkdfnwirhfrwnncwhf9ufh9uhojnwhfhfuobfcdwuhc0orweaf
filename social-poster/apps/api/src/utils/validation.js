function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 8;
}

function validateString(value, minLength = 1, maxLength = 1000) {
  if (!value || typeof value !== 'string') return false;
  return value.length >= minLength && value.length <= maxLength;
}

function validateSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

function validatePlatform(platform) {
  const validPlatforms = ['INSTAGRAM', 'FACEBOOK', 'YOUTUBE', 'YOUTUBE_SHORTS', 'PINTEREST'];
  return validPlatforms.includes(platform);
}

function validateMimeType(mimeType) {
  const validMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/webm',
  ];
  return validMimeTypes.includes(mimeType);
}

function validateFileSize(size, maxSizeBytes = 100 * 1024 * 1024) {
  return typeof size === 'number' && size > 0 && size <= maxSizeBytes;
}

module.exports = {
  validateEmail,
  validatePassword,
  validateString,
  validateSlug,
  validatePlatform,
  validateMimeType,
  validateFileSize,
};
