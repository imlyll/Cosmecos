const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { cloudinary, isCloudinaryEnabled } = require('../config/cloudinary');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

function uploadToCloudinary(file, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `cosmecos/${folder}`, resource_type: 'image' },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(file.buffer);
  });
}

async function uploadToDisk(file, folder) {
  const dir = path.join(UPLOAD_DIR, folder);
  await fs.mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXT_BY_MIME[file.mimetype] || ''}`;
  await fs.writeFile(path.join(dir, name), file.buffer);
  const publicId = `${folder}/${name}`;
  return { url: `/uploads/${publicId}`, publicId };
}

/** Stores an in-memory multer file and returns { url, publicId }. */
function uploadImage(file, folder = 'products') {
  return isCloudinaryEnabled ? uploadToCloudinary(file, folder) : uploadToDisk(file, folder);
}

/** Best-effort removal; failures are logged, not thrown, so they never break the request. */
async function deleteImage(publicId) {
  if (!publicId) return;
  try {
    if (isCloudinaryEnabled) {
      await cloudinary.uploader.destroy(publicId);
    } else {
      const target = path.resolve(UPLOAD_DIR, publicId);
      if (target.startsWith(UPLOAD_DIR + path.sep)) await fs.unlink(target);
    }
  } catch (err) {
    console.warn(`Failed to delete image ${publicId}: ${err.message}`);
  }
}

module.exports = { uploadImage, deleteImage, UPLOAD_DIR };
