const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getHistory,
  getDashboard,
} = require("../controllers/historyController");

router.get("/", authMiddleware, getHistory);

router.get("/dashboard", authMiddleware, getDashboard);

module.exports = router;