const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const prisma = require('../utils/prisma');
const storage = require('../utils/storage');
const { badRequest, notFound } = require('../utils/errors');
const { validateMimeType, validateFileSize } = require('../utils/validation');
const logger = require('../utils/logger');

async function uploadMedia(companyId, postId, file) {
  if (!validateMimeType(file.mimetype)) {
    throw badRequest(`Unsupported file type: ${file.mimetype}`);
  }

  if (!validateFileSize(file.size)) {
    throw badRequest('File size exceeds maximum allowed (100MB)');
  }

  const extension = file.originalname.split('.').pop();
  const key = `uploads/${companyId}/${uuidv4()}.${extension}`;

  await storage.uploadFile(key, file.buffer, file.mimetype);

  const media = await prisma.media.create({
    data: {
      companyId,
      postId,
      originalKey: key,
      mimeType: file.mimetype,
      size: file.size,
      processingStatus: 'PENDING',
    },
  });

  logger.info('Media uploaded', { mediaId: media.id, key, mimeType: file.mimetype });

  return media;
}

async function getMedia(id, companyId) {
  const media = await prisma.media.findFirst({
    where: { id, companyId },
    include: {
      variants: true,
    },
  });

  if (!media) {
    throw notFound('Media not found');
  }

  return media;
}

async function processMedia(mediaId, companyId, options = {}) {
  const media = await prisma.media.findFirst({
    where: { id: mediaId, companyId },
  });

  if (!media) {
    throw notFound('Media not found');
  }

  await prisma.media.update({
    where: { id: mediaId },
    data: { processingStatus: 'PROCESSING' },
  });

  try {
    if (media.mimeType.startsWith('image/')) {
      await processImage(media, options);
    } else if (media.mimeType.startsWith('video/')) {
      await processVideo(media, options);
    }

    await prisma.media.update({
      where: { id: mediaId },
      data: { processingStatus: 'COMPLETED' },
    });

    logger.info('Media processed', { mediaId });
  } catch (error) {
    await prisma.media.update({
      where: { id: mediaId },
      data: { processingStatus: 'FAILED' },
    });
    logger.error('Media processing failed', { mediaId, error: error.message });
    throw error;
  }
}

async function processImage(media, options) {
  const { mode = 'INTELLIGENT', focalPointX = 0.5, focalPointY = 0.5, platforms = [] } = options;

  const imageBuffer = await storage.getFile(media.originalKey);
  const chunks = [];
  for await (const chunk of imageBuffer) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  const platformSpecs = {
    INSTAGRAM: { width: 1080, height: 1080 },
    FACEBOOK: { width: 1200, height: 630 },
    PINTEREST: { width: 1000, height: 1500 },
  };

  for (const platform of platforms) {
    const spec = platformSpecs[platform];
    if (!spec) continue;

    let processedBuffer;

    if (mode === 'INTELLIGENT') {
      const metadata = await sharp(buffer).metadata();
      const cropX = Math.floor(metadata.width * focalPointX - spec.width / 2);
      const cropY = Math.floor(metadata.height * focalPointY - spec.height / 2);

      processedBuffer = await sharp(buffer)
        .extract({
          left: Math.max(0, cropX),
          top: Math.max(0, cropY),
          width: Math.min(spec.width, metadata.width - Math.max(0, cropX)),
          height: Math.min(spec.height, metadata.height - Math.max(0, cropY)),
        })
        .resize(spec.width, spec.height, { fit: 'cover' })
        .toBuffer();
    } else {
      processedBuffer = await sharp(buffer)
        .resize(spec.width, spec.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .toBuffer();
    }

    const variantKey = `variants/${media.id}/${platform.toLowerCase()}-${uuidv4()}.jpg`;
    await storage.uploadFile(variantKey, processedBuffer, 'image/jpeg');

    await prisma.mediaVariant.create({
      data: {
        mediaId: media.id,
        platform,
        variantKey,
        width: spec.width,
        height: spec.height,
        processingMode: mode,
      },
    });
  }
}

async function processVideo(media, options) {
  logger.info('Video processing queued', { mediaId: media.id });
}

async function deleteMedia(id, companyId) {
  const media = await prisma.media.findFirst({
    where: { id, companyId },
    include: { variants: true },
  });

  if (!media) {
    throw notFound('Media not found');
  }

  try {
    await storage.deleteFile(media.originalKey);
    for (const variant of media.variants) {
      await storage.deleteFile(variant.variantKey);
    }
  } catch (error) {
    logger.warn('Failed to delete files from storage', { mediaId: id, error: error.message });
  }

  await prisma.media.delete({ where: { id } });

  logger.info('Media deleted', { mediaId: id });

  return { success: true };
}

module.exports = {
  uploadMedia,
  getMedia,
  processMedia,
  deleteMedia,
};
