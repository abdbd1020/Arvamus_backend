const express = require('express');

const studentController = require('../controllers/studentController');

const router = express.Router();

router.get('/get_all_student', studentController.getAllStudent);
router.get('/get_total_student', studentController.getNumberOfStudents);
router.post('/invite_student', studentController.inviteStudent);

module.exports = router;
