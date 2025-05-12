const express = require('express');
const authController = require('../controllers/auth.controller');
const router = express.Router();

// Auth routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Security question routes
router.get('/security-questions', authController.getSecurityQuestions);
router.post('/security-questions', authController.saveUserSecurityAnswers);

// Password reset using security questions
router.post('/find-username', authController.findUsername);
router.post('/get-security-questions', authController.getUserSecurityQuestions);
router.post('/verify-security-answers', authController.verifySecurityAnswers);
router.post('/reset-password', authController.resetPassword);

module.exports = router; 