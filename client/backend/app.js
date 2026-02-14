const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const passport = require('passport');

const authRoutes = require('./routes/auth');
const databaseRoutes = require('./routes/databases');
const queryRoutes = require('./routes/queries');
const conversationRoutes = require('./routes/conversations');

const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());

// On Vercel (same-origin) CORS isn't strictly necessary, but keeping it makes local dev easier
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : 'http://localhost:3000',
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Important for Next.js API routes: disable Next bodyParser and let Express handle it
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(passport.initialize());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Mount everything under /api so it works behind Next.js API routes
app.use('/api/auth', authRoutes);
app.use('/api/databases', databaseRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/conversations', conversationRoutes);

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

app.use(errorHandler);

module.exports = app;


