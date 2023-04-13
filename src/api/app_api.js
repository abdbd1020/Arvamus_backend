const express = require('express');

const appController = require('../controllers/appController');

const router = express.Router();

router.post('/login', appController.login);
router.post('/signup', appController.signup);
router.post('/change_password', appController.changePassword);
router.post('/forgot_password', appController.forgotPassword);
router.post('/update_info', appController.updateInfo);


module.exports = router;
