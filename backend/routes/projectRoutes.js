const express = require("express");
const router = express.Router();

const { generateProjects } = require("../controllers/projectController");

router.post("/recommend", generateProjects);

module.exports = router;