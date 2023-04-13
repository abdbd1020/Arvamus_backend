const express = require('express');
const accessApi = require('./accessRequest');
const userApi = require('./user');
const dashboardApi = require('./dashboard');
const adminApi = require('./admin');
const appApi = require('./app_api');
const reviewApi = require('./review');
const ratingApi = require('./rating');

const router = express.Router();

router.use(accessApi);
router.use(userApi);
router.use(dashboardApi);
router.use(adminApi);
router.use(appApi);
router.use(reviewApi);
router.use(ratingApi);

module.exports = router;
