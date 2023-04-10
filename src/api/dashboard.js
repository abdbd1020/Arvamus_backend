const express = require('express');

const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.get('/database_commit', dashboardController.databaseCommit);
router.get('/get_total_country', dashboardController.getTotalCountry);

module.exports = router;
