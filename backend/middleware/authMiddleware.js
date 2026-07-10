const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        // Get token from request header
        const token = req.header("Authorization");

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token, authorization denied",
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Save user id in request
        req.user = decoded;

        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid token",
        });
    }
};

module.exports = authMiddleware;