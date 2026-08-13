const dotenv = require('dotenv');
const path = require('path');

// dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });
const envPath = path.resolve(__dirname, '..', '..', '..', '..', '.env');
const result = dotenv.config({ path: envPath, override: true });

if (result.error) {
  console.warn('Warning: .env file not loaded from', envPath, result.error.message);
}

if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length !== 64) {
  console.error('CRITICAL: ENCRYPTION_KEY is missing or invalid in .env at', envPath);
  console.error('Current value:', process.env.ENCRYPTION_KEY?.substring(0, 10) + '...');
}


const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/social_cms',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'change-me-to-a-long-random-secret',
  encryptionKey: process.env.ENCRYPTION_KEY || 'change-me-to-32-byte-hex-key',
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
    bucket: process.env.S3_BUCKET || 'social-cms-media',
  },
  systemTimezone: process.env.SYSTEM_TIMEZONE || 'Asia/Kolkata',
  oauthBaseUrl: process.env.OAUTH_BASE_URL || 'http://localhost:4000',
  webUrl: process.env.WEB_URL || 'http://localhost:5173',
};

module.exports = config;
