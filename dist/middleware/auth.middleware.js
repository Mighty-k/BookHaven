"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const jwt_utils_1 = require("../utils/jwt.utils");
const user_model_1 = require("../models/user.model");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const token = authHeader.split(" ")[1];
        const payload = (0, jwt_utils_1.verifyAccessToken)(token);
        const user = await user_model_1.User.findById(payload.userId).select("-password -refreshTokens -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires");
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        req.user = user;
        req.user.id = user._id;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        if (!roles.includes(user.role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }
        next();
    };
};
exports.authorize = authorize;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next();
        }
        const token = authHeader.split(" ")[1];
        const payload = (0, jwt_utils_1.verifyAccessToken)(token);
        const user = await user_model_1.User.findById(payload.userId).select("-password -refreshTokens");
        if (user) {
            req.user = user;
            req.user.id = user._id;
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
