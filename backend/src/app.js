const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const complaintsRoutes = require('./routes/complaints.routes');
const noticesRoutes = require('./routes/notices.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const settingsRoutes = require('./routes/settings.routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  const allowedOrigins = (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: allowedOrigins.includes('*') ? true : allowedOrigins,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  app.use('/api/auth', authRoutes);
  app.use('/api/complaints', complaintsRoutes);
  app.use('/api/notices', noticesRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/settings', settingsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
