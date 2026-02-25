"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const auth_validation_1 = require("../validations/auth.validation");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
// Public routes
router.post("/register", auth_validation_1.registerValidation, authController.register);
router.post("/login", auth_validation_1.loginValidation, authController.login);
router.post("/refresh-token", authController.refreshToken);
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/resend-verification", auth_validation_1.emailValidation, authController.resendVerification);
router.post("/forgot-password", auth_validation_1.emailValidation, authController.forgotPassword);
router.post("/reset-password/:token", auth_validation_1.resetPasswordValidation, authController.resetPassword);
// Protected routes
router.use(auth_middleware_1.authenticate);
router.post("/logout", authController.logout);
router.post("/logout-all", authController.logoutAll);
router.post("/change-password", auth_validation_1.changePasswordValidation, authController.changePassword);
router.get("/profile", authController.getProfile);
exports.default = router;
