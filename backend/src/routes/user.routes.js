const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes below use the protect middleware
router.use(protect);

// User profile routes
router.get('/profile', userController.getCurrentProfile);
router.patch('/profile', userController.updateProfile);
router.delete('/profile', userController.deleteAccount);

// Password management
router.patch('/change-password', userController.changePassword);

module.exports = router; 