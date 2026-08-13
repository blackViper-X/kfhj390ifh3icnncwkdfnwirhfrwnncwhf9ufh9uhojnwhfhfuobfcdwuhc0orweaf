const facebook = require('./facebook');
const instagram = require('./instagram');
const youtube = require('./youtube');
const pinterest = require('./pinterest');

function getAdapter(platform) {
  switch (platform) {
    case 'FACEBOOK':
      return facebook;
    case 'INSTAGRAM':
      return instagram;
    case 'YOUTUBE':
    case 'YOUTUBE_SHORTS':
      return youtube;
    case 'PINTEREST':
      return pinterest;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

module.exports = {
  getAdapter,
};
