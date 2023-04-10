const express = require('express');
const accessApi = require('./accessRequest');
const studentApi = require('./student');
const teacherApi = require('./teacher');
const dashboardApi = require('./dashboard');
const adminApi = require('./admin');
const appApi = require('./app_api');

const router = express.Router();

router.use(accessApi);
router.use(studentApi);
router.use(teacherApi);
router.use(dashboardApi);
router.use(adminApi);
router.use(appApi);

module.exports = router;
