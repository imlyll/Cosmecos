const multer = require('multer');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 8;

// Files stay in memory; utils/storage decides whether they go to Cloudinary or disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
    cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}. Use JPEG, PNG, WebP or AVIF.`));
  },
});

const productImages = upload.array('images', MAX_FILES);
const singleImage = upload.single('image');

module.exports = { productImages, singleImage };
