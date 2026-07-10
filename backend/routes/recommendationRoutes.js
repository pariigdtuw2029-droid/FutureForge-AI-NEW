const express = require("express");
const router = express.Router();

const {
  getRecommendation,
} = require("../controllers/recommendationController");

router.get("/", (req, res) => {
    res.send("Recommendation route is working!");
})
router.get("/", (req, res) => {
    res.send("Recommendation route is working!");
});

router.get("/", (req, res) => {
    res.send("Recommendation route is working!");
});

router.post("/", getRecommendation);

module.exports = router;