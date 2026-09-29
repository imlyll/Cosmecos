const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const mongoose = require('mongoose');
const { verifyMailer } = require('./utils/mailer');

async function start() {
  await connectDB(env.mongoUri);
  const server = app.listen(env.port, () => {
    console.log(`Cosmecos API running on http://localhost:${env.port} (${env.nodeEnv})`);
  });
  // Reports SMTP problems (e.g. a wrong Gmail App Password) at boot; never blocks startup.
  verifyMailer();

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
