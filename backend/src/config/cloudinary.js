const cloudinary = require('cloudinary').v2;
const { cloudinary: cfg } = require('./env');

const isCloudinaryEnabled = Boolean(cfg.cloudName && cfg.apiKey && cfg.apiSecret);

if (isCloudinaryEnabled) {
  cloudinary.config({
    cloud_name: cfg.cloudName,
    api_key: cfg.apiKey,
    api_secret: cfg.apiSecret,
    secure: true,
  });
}

module.exports = { cloudinary, isCloudinaryEnabled };
