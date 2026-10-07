// The Express application (routes + middleware).
// Keeping the app separate from server.js makes it easy to test later,
// because tests can import `app` without opening a network port.
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
// Phase 4 - veterinary functionality
const vetDirectoryRoutes = require('./routes/vetDirectoryRoutes');
const vetRoutes = require('./routes/vetRoutes');
const referralRoutes = require('./routes/referralRoutes');
// Phase 5 - admin & alerting
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// We are often behind a proxy (hosting platforms) - this keeps req.ip correct.
app.set('trust proxy', 1);

// ---- CORS ------------------------------------------------------------------
// Allowed origins:
//  1. CLIENT_URL (one URL, or several separated by commas)
//  2. This project's own Vercel deployment URLs (branch / preview deployments),
//     e.g. https://vet-alert-system-git-main-shaunmicheals-projects.vercel.app
const allowedOrigins = String(env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const vercelProjectPattern =
  /^https:\/\/vet-alert-system(-[a-z0-9-]+)?-shaunmicheals-projects\.vercel\.app$/;

const corsOptions = {
  origin(origin, callback) {
    // No Origin header = non-browser clients (curl, health checks) - allow.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || vercelProjectPattern.test(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Parse JSON bodies. The limit protects the API from very large payloads.
app.use(express.json({ limit: '1mb' }));

// ---- Health check ----------------------------------------------------------
// Confirms the API is up and reports whether the database is reachable.
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

// ---- API routes ------------------------------------------------------------
app.use('/api/auth', authRoutes);

// Farmer module (login + FARMER role required inside each router)
app.use('/api/farmer', farmerRoutes); // farm profile  -> /api/farmer/farm
app.use('/api/animals', animalRoutes); // animal CRUD   -> /api/animals
app.use('/api/reports', healthReportRoutes); // health reports -> /api/reports

// Phase 4 - veterinary functionality
app.use('/api/vets', vetDirectoryRoutes); // professional directory -> /api/vets
app.use('/api/vet', vetRoutes); // vet workspace -> /api/vet/profile, /api/vet/cases
app.use('/api/referrals', referralRoutes); // farmer referrals -> /api/referrals

// Phase 5 - admin & alerting
app.use('/api/admin', adminRoutes); // admin oversight -> /api/admin/alerts, /api/admin/stats

// TEMPORARY Phase 1 role-testing routes - never mounted in production.
if (env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require
  app.use('/api/dev', require('./routes/devRoutes'));
}

// ---- 404 + centralized errors (must be registered LAST) --------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;