"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const google_auth_library_1 = require("google-auth-library");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_validation_1 = require("../validations/auth.validation");
const user_model_1 = require("../models/user.model");
const jwt_utils_1 = require("../utils/jwt.utils");
const mongoose_1 = __importDefault(require("mongoose"));
const getIdAsString = (id) => {
    if (id instanceof mongoose_1.default.Types.ObjectId) {
        return id.toString();
    }
    return String(id);
};
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
// Initialize Google OAuth client
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
// Public routes
router.post("/register", auth_validation_1.registerValidation, validation_middleware_1.validate, authController.register);
router.post("/login", auth_validation_1.loginValidation, validation_middleware_1.validate, authController.login);
router.post("/refresh-token", authController.refreshToken);
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/resend-verification", auth_validation_1.emailValidation, validation_middleware_1.validate, authController.resendVerification);
router.post("/forgot-password", auth_validation_1.emailValidation, validation_middleware_1.validate, authController.forgotPassword);
router.post("/reset-password/:token", auth_validation_1.resetPasswordValidation, validation_middleware_1.validate, authController.resetPassword);
// Google OAuth route
router.post("/google", async (req, res, next) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ message: "Google credential is required" });
        }
        // Verify the Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ message: "Invalid Google token" });
        }
        // Find or create user
        let user = await user_model_1.User.findOne({ email: payload.email });
        if (!user) {
            // Create new user from Google data
            user = new user_model_1.User({
                email: payload.email,
                name: payload.name || "Google User",
                password: Math.random().toString(36), // Random password (user will use Google to login)
                isEmailVerified: payload.email_verified || false,
                avatar: payload.picture,
                role: "customer",
            });
            await user.save();
        }
        // Convert ObjectId to string safely
        const userId = user._id instanceof mongoose_1.default.Types.ObjectId
            ? user._id.toString()
            : String(user._id);
        // Generate tokens
        const tokens = (0, jwt_utils_1.generateTokens)({
            userId: userId, // Now it's a string
            email: user.email,
            role: user.role,
        });
        // Save refresh token
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);
        user.refreshTokens.push({
            token: tokens.refreshToken,
            expiresAt: refreshTokenExpiry,
        });
        await user.save();
        res.json({
            success: true,
            data: {
                user: {
                    id: userId, // Use the converted string ID
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    avatar: user.avatar,
                    isEmailVerified: user.isEmailVerified,
                },
                tokens,
            },
        });
    }
    catch (error) {
        console.error("Google OAuth error:", error);
        next(error);
    }
});
// Protected routes
router.use(auth_middleware_1.authenticate);
router.post("/logout", authController.logout);
router.post("/logout-all", authController.logoutAll);
router.post("/change-password", auth_validation_1.changePasswordValidation, validation_middleware_1.validate, authController.changePassword);
router.get("/profile", authController.getProfile);
exports.default = router;
