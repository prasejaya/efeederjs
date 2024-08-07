const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/passport');
const dashboardController = require('../app/controllers/dashboardController');

// Dashboard
router.get('/', ensureAuthenticated, dashboardController.index);

module.exports = router;