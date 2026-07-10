const express = require("express");
const router = express.Router();

const { registerUser,loginUser, } = require("../controllers/userController");
const authMiddleware =require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login",loginUser);
router.get("/profile", authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "Welcome! You are authorized.",
        user: req.user,
    });
});
module.exports = router;