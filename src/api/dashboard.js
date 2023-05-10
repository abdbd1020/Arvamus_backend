const express = require("express");

const dashboardController = require("../controllers/dashboardController");

const router = express.Router();

router.get("/database_commit", dashboardController.databaseCommit);
router.get("/drop_tables", dashboardController.dropTables);
router.get("/get_all_teachers", dashboardController.getAllTeachers);
router.get("/get_all_staff", dashboardController.getAllStaff);

module.exports = router;
