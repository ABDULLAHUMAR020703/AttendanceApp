const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API Gateway is running',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'API Gateway Service',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      health: '/health',
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`API Gateway server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});

module.exports = app;

