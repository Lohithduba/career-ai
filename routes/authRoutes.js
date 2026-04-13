const express = require('express');
const router = express.Router();

// Import the functions from the controller
const { syncUser, register, login, updateOnboarding } = require('../controllers/authController');

// Define routes using the imported functions
router.post('/sync', syncUser);           // Line 6 - Where the error was
router.post('/register', register);
router.post('/login', login);
router.post('/onboard', updateOnboarding);

module.exports = router;