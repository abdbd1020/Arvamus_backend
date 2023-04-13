const express = require('express');

const adminController = require('../controllers/adminController');

const router = express.Router();

router.post('/create_admin', adminController.createAdmin);
router.post('/admin_login', adminController.adminLogin);
router.post('/admin_change_password', adminController.adminChangePassword);

module.exports = router;
