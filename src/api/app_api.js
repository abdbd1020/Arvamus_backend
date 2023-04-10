const express = require('express');

const appController = require('../controllers/appController');

const router = express.Router();

router.post('/login', appController.login);
router.post('/change_password', appController.changePassword);
router.post('/forgot_password', appController.forgotPassword);
router.post('/update_info', appController.updateInfo);
router.post('/send_score', appController.sendScore);
router.post('/get_add_quiz', appController.getAddQuiz);
router.post('/get_sub_quiz', appController.getSubQuiz);
router.post('/get_mul_quiz', appController.getMulQuiz);
router.post('/get_div_quiz', appController.getDivQuiz);

module.exports = router;
