const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const config = require('../config');
const logger = require('./logger');

const s3Client = new S3Client({
  endpoint: config.s3.endpoint,
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
  forcePathStyle: true,
});

async function ensureBucket() {
  try {
    const { CreateBucketCommand } = require('@aws-sdk/client-s3');
    await s3Client.send(new CreateBucketCommand({ Bucket: config.s3.bucket }));
    logger.info('S3 bucket created/ensured', { bucket: config.s3.bucket });
  } catch (error) {
    if (error.name !== 'BucketAlreadyOwnedByYou' && error.name !== 'BucketAlreadyExists') {
      logger.warn('S3 bucket check failed (may already exist)', { error: error.message });
    }
  }
}

async function uploadFile(key, body, contentType) {
  const command = new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);
  logger.info('File uploaded to S3', { key, contentType });
  return key;
}

async function getFile(key) {
  const command = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });

  const response = await s3Client.send(command);
  return response.Body;
}

async function deleteFile(key) {
  const command = new DeleteObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });

  await s3Client.send(command);
  logger.info('File deleted from S3', { key });
}

async function fileExists(key) {
  try {
    const command = new HeadObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

async function getSignedDownloadUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

function getFileUrl(key) {
  return `${config.s3.endpoint}/${config.s3.bucket}/${key}`;
}

module.exports = {
  s3Client,
  ensureBucket,
  uploadFile,
  getFile,
  deleteFile,
  fileExists,
  getSignedDownloadUrl,
  getFileUrl,
};
