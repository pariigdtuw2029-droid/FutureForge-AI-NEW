const express = require("express");
const router = express.Router();

const {
  generateRoadmap,
} = require("../controllers/roadmapController");

router.post("/", generateRoadmap);

module.exports = router;