const express = require('express');
const cors = require('cors');

const prisma = require('./config/prisma');
const { env } = require('./config/env');
const { sendSuccess } = require('./utils/response');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const animalRoutes = require('./routes/animalRoutes');
const healthReportRoutes = require('./routes/healthReportRoutes');
const vetDirectoryRoutes = require('./routes/vetDirectoryRoutes');
const vetRoutes = require('./routes/vetRoutes');
const referralRoutes = require('./routes/referralRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reminderRoutes = require('./routes/reminderRoutes');

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = String(env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const vercelProjectPattern =
  /^https:\/\/vet-alert-system(-[a-z0-9-]+)?-shaunmicheals-projects\.vercel\.app$/;

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || vercelProjectPattern.test(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (req, res) => {
  let database = 'unknown';
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'connected';
  } catch {
    database = 'disconnected';
  }

  return sendSuccess(res, {
    status: 'ok',
    service: 'VetAlert Zimbabwe API',
    database,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);

app.use('/api/farmer', farmerRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/reports', healthReportRoutes);

app.use('/api/vets', vetDirectoryRoutes);
app.use('/api/vet', vetRoutes);
app.use('/api/referrals', referralRoutes);

app.use('/api/reminders', reminderRoutes);

app.use('/api/admin', adminRoutes);

if (env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require
  app.use('/api/dev', require('./routes/devRoutes'));
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
