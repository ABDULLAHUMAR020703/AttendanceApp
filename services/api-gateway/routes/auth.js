const express = require('express');
const axios = require('axios');

const router = express.Router();

// Auth service base URL
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

/**
 * Forward login request to auth-service
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, req.body, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('API Gateway - Login forwarding error:', error.message);
    
    if (error.response) {
      // Auth service responded with error
      res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      res.status(503).json({
        success: false,
        error: 'Auth service unavailable',
        message: 'Unable to connect to authentication service',
      });
    } else {
      // Error setting up request
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
});

/**
 * Forward username check request to auth-service
 * GET /api/auth/check-username/:username
 */
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/check-username/${username}`, {
      timeout: 10000,
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('API Gateway - Check username forwarding error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      res.status(503).json({
        success: false,
        error: 'Auth service unavailable',
        message: 'Unable to connect to authentication service',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
});

/**
 * Forward user creation request to auth-service
 * POST /api/auth/users
 */
router.post('/users', async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/users`, req.body, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('API Gateway - Create user forwarding error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      res.status(503).json({
        success: false,
        error: 'Auth service unavailable',
        message: 'Unable to connect to authentication service',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
});

/**
 * Forward user role update request to auth-service
 * PATCH /api/auth/users/:username/role
 */
router.patch('/users/:username/role', async (req, res) => {
  try {
    const { username } = req.params;
    const response = await axios.patch(
      `${AUTH_SERVICE_URL}/api/auth/users/${username}/role`,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('API Gateway - Update role forwarding error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      res.status(503).json({
        success: false,
        error: 'Auth service unavailable',
        message: 'Unable to connect to authentication service',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
});

/**
 * Forward user info update request to auth-service
 * PATCH /api/auth/users/:username
 */
router.patch('/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const response = await axios.patch(
      `${AUTH_SERVICE_URL}/api/auth/users/${username}`,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('API Gateway - Update user forwarding error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      res.status(503).json({
        success: false,
        error: 'Auth service unavailable',
        message: 'Unable to connect to authentication service',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
});

module.exports = router;

