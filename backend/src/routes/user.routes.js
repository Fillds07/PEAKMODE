const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

// Protected routes (require authentication)
router.get('/profile', authMiddleware, userController.getProfile);
router.patch('/profile', authMiddleware, userController.updateProfile);
router.patch('/change-password', authMiddleware, userController.changePassword);
router.delete('/profile', authMiddleware, userController.deleteAccount);

// Security question management (protected)
router.get('/security-questions', authMiddleware, userController.getUserSecurityQuestions);
router.post('/security-questions', authMiddleware, userController.updateSecurityQuestions);

module.exports = router; 