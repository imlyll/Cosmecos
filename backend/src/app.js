const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const routes = require('./routes');
const ApiError = require('./utils/ApiError');
const { detectLanguage } = require('./utils/i18n');
const { UPLOAD_DIR } = require('./utils/storage');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.set('trust proxy', 1);
// Images are served cross-origin to the storefront.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || env.clientUrls.includes(origin)),
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
if (env.nodeEnv !== 'test') app.use(morgan(env.isProd ? 'combined' : 'dev'));

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));
// General limit for the whole API; auth and contact routes have stricter ones of their own.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => next(ApiError.tooManyRequests('Too many attempts, please try again later')),
});
app.use('/api', detectLanguage, apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
