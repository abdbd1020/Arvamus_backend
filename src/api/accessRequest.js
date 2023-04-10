const express = require('express');

const accessController = require('../controllers/accessRequestController');

const router = express.Router();

router.post('/access_request', accessController.createAccessRequests);
router.get('/get_all_access_request', accessController.getAllAccessRequests);
router.post('/approve_access_request', accessController.approveAccessRequest);
router.post('/reject_access_request', accessController.rejectAccessRequest);

module.exports = router;
