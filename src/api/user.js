const express = require('express');

const userController = require('../controllers/userController');
const router = express.Router();

router.get('/test_api', userController.testApi);


module.exports = router;
