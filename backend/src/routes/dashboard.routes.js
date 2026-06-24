const express = require("express");

const router = express.Router();

const {
  getDashboardStats,
} = require("../controllers/dashboard.controller");

router.get("/stats", getDashboardStats);

module.exports = router;