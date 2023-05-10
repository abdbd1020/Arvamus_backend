const express = require("express");

const userController = require("../controllers/userController");
const router = express.Router();

router.post("/get_public_key_by_email", userController.getPublicKeybyEmail);
router.post("/get_public_key_by_user_id", userController.getPublicKeybyUserId);

module.exports = router;
