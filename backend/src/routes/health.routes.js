const express = require('express');
const healthController = require('../controllers/health.controller');
const router = express.Router();

// Health check routes
router.get('/', healthController.getHealthStatus);
router.get('/db', healthController.getDatabaseStatus);

module.exports = router; 