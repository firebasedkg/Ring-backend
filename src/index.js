require('dotenv').config();

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (error) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT env var:', error);
  }
} else {
  try {
    serviceAccount = require('../firebase-service-account.json');
  } catch (error) {
    console.warn('Could not load local firebase-service-account.json');
  }
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  console.error("Firebase Admin not initialized. Missing credentials.");
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({ status: 'Wellness backend is running!' });
});

// Mount routes
app.use('/api/health', require('./routes/health'));
app.use('/api/sleep', require('./routes/sleep'));
app.use('/api/mood', require('./routes/mood'));
app.use('/api/journal', require('./routes/journal'));
app.use('/api/streaks', require('./routes/streaks'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server only if not in production (Vercel sets NODE_ENV to production)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wellness backend listening on port ${PORT}`);
  });
}

// Export for Vercel serverless function
module.exports = app;
