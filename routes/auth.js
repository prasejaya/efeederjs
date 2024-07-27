const express = require('express');
const router = express.Router();
const authController = require('../app/controllers/authController');

// Login Page
router.get('/', authController.login);

// Login Handle
router.post('/', authController.loginPost);

// Register Page (Optional)
router.get('/register', authController.register);

// Register Handle (Optional)
router.post('/register', authController.registerPost);

// Logout Handle
router.get('/logout', authController.logout);

module.exports = router;