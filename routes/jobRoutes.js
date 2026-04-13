const express = require('express');
const router = express.Router();
const { getLiveJobs } = require('../controllers/jobController');

// Proxy route to fetch external jobs
router.get('/live', getLiveJobs);

module.exports = router;