"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const express_validator_1 = require("express-validator");
class AuthController {
    async register(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { email, password, name } = req.body;
            const { user, tokens } = await auth_service_1.authService.register({
                email,
                password,
                name,
            });
            res.status(201).json({
                success: true,
                message: "Registration successful. Please verify your email.",
                data: {
                    user: {
                        id: user._id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        isEmailVerified: user.isEmailVerified,
                    },
                    tokens,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { email, password } = req.body;
            const { user, tokens } = await auth_service_1.authService.login({ email, password });
            res.json({
                success: true,
                message: "Login successful",
                data: {
                    user: {
                        id: user._id,
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
            next(error);
        }
    }
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ message: "Refresh token required" });
            }
            const tokens = await auth_service_1.authService.refreshToken({ refreshToken });
            res.json({
                success: true,
                data: tokens,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const userId = req.user?._id;
            if (userId && refreshToken) {
                await auth_service_1.authService.logout(userId, refreshToken);
            }
            res.json({
                success: true,
                message: "Logged out successfully",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async logoutAll(req, res, next) {
        try {
            const userId = req.user?._id;
            if (userId) {
                await auth_service_1.authService.logoutAll(userId);
            }
            res.json({
                success: true,
                message: "Logged out from all devices",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async verifyEmail(req, res, next) {
        try {
            const { token } = req.params;
            const tokenStr = Array.isArray(token) ? token[0] : token;
            await auth_service_1.authService.verifyEmail(tokenStr);
            res.json({
                success: true,
                message: "Email verified successfully",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resendVerification(req, res, next) {
        try {
            const { email } = req.body;
            await auth_service_1.authService.resendVerificationEmail(email);
            res.json({
                success: true,
                message: "Verification email sent",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            await auth_service_1.authService.forgotPassword(email);
            res.json({
                success: true,
                message: "If an account exists with this email, a password reset link will be sent",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resetPassword(req, res, next) {
        try {
            const { token } = req.params;
            const { password } = req.body;
            const tokenStr = Array.isArray(token) ? token[0] : token;
            await auth_service_1.authService.resetPassword(tokenStr, password);
            res.json({
                success: true,
                message: "Password reset successful",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async changePassword(req, res, next) {
        try {
            const userId = req.user?._id;
            const { currentPassword, newPassword } = req.body;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            await auth_service_1.authService.changePassword(userId, currentPassword, newPassword);
            res.json({
                success: true,
                message: "Password changed successfully",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getCurrentUser(req, res, next) {
        try {
            const user = req.user;
            res.json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getProfile(req, res, next) {
        try {
            const user = req.user;
            res.json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
