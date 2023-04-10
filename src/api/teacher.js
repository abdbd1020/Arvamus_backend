const express = require('express');

const teacherController = require('../controllers/teacherController');

const router = express.Router();

router.get('/get_all_teacher', teacherController.getAllTeacher);
router.get('/get_total_teacher', teacherController.getNumberOfTeachers);
router.post('/invite_teacher', teacherController.inviteTeacher);
router.post('/get_students', teacherController.getStudents);

module.exports = router;
