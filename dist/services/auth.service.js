"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const user_model_1 = require("../models/user.model");
const jwt_utils_1 = require("../utils/jwt.utils");
const email_utils_1 = require("../utils/email.utils");
const crypto_1 = __importDefault(require("crypto"));
class AuthService {
    async register(data) {
        // Check if user already exists
        const existingUser = await user_model_1.User.findOne({ email: data.email.toLowerCase() });
        if (existingUser) {
            throw new Error('User already exists with this email');
        }
        // Create new user
        const user = new user_model_1.User({
            email: data.email.toLowerCase(),
            password: data.password,
            name: data.name,
        });
        await user.save();
        // Generate tokens
        const tokens = (0, jwt_utils_1.generateTokens)(user);
        // Save refresh token
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days
        user.refreshTokens.push({
            token: tokens.refreshToken,
            expiresAt: refreshTokenExpiry,
        });
        await user.save();
        // Generate email verification token
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await user.save();
        // Send verification email (don't await - fire and forget)
        (0, email_utils_1.sendVerificationEmail)(user.email, verificationToken).catch(console.error);
        return { user, tokens };
    }
    async login(data) {
        // Find user
        const user = await user_model_1.User.findOne({ email: data.email.toLowerCase() });
        if (!user) {
            throw new Error('Invalid email or password');
        }
        // Check if account is locked
        if (user.isLocked()) {
            const lockTime = user.lockUntil ? Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000) : 30;
            throw new Error(`Account is locked. Please try again in ${lockTime} minutes`);
        }
        // Verify password
        const isPasswordValid = await user.comparePassword(data.password);
        if (!isPasswordValid) {
            await user.incrementLoginAttempts();
            throw new Error('Invalid email or password');
        }
        // Reset login attempts on successful login
        await user.resetLoginAttempts();
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        // Generate new tokens
        const tokens = (0, jwt_utils_1.generateTokens)(user);
        // Clean old refresh tokens (keep only last 5)
        const recentTokens = user.refreshTokens
            .sort((a, b) => b.expiresAt.getTime() - a.expiresAt.getTime())
            .slice(0, 4);
        // Add new refresh token
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);
        recentTokens.push({
            token: tokens.refreshToken,
            expiresAt: refreshTokenExpiry,
        });
        user.refreshTokens = recentTokens;
        await user.save();
        return { user, tokens };
    }
    async refreshToken(data) {
        // Verify refresh token
        let payload;
        try {
            payload = (0, jwt_utils_1.verifyRefreshToken)(data.refreshToken);
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
        // Find user with this refresh token
        const user = await user_model_1.User.findOne({
            _id: payload.userId,
            'refreshTokens.token': data.refreshToken,
        });
        if (!user) {
            throw new Error('Refresh token not found');
        }
        // Remove the used refresh token
        user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== data.refreshToken);
        // Generate new tokens
        const tokens = (0, jwt_utils_1.generateTokens)(user);
        // Save new refresh token
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);
        user.refreshTokens.push({
            token: tokens.refreshToken,
            expiresAt: refreshTokenExpiry,
        });
        await user.save();
        return tokens;
    }
    async logout(userId, refreshToken) {
        await user_model_1.User.updateOne({ _id: userId }, { $pull: { refreshTokens: { token: refreshToken } } });
    }
    async logoutAll(userId) {
        await user_model_1.User.updateOne({ _id: userId }, { $set: { refreshTokens: [] } });
    }
    async verifyEmail(token) {
        const user = await user_model_1.User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: new Date() },
        });
        if (!user) {
            throw new Error('Invalid or expired verification token');
        }
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();
    }
    async resendVerificationEmail(email) {
        const user = await user_model_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            throw new Error('User not found');
        }
        if (user.isEmailVerified) {
            throw new Error('Email already verified');
        }
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();
        // Send verification email
        await (0, email_utils_1.sendVerificationEmail)(user.email, verificationToken);
    }
    async forgotPassword(email) {
        const user = await user_model_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Don't reveal that user doesn't exist
            return;
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();
        // Send password reset email
        await (0, email_utils_1.sendPasswordResetEmail)(user.email, resetToken);
    }
    async resetPassword(token, newPassword) {
        const user = await user_model_1.User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: new Date() },
        });
        if (!user) {
            throw new Error('Invalid or expired reset token');
        }
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        // Invalidate all refresh tokens on password reset
        user.refreshTokens = [];
        await user.save();
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }
        user.password = newPassword;
        // Optionally invalidate all refresh tokens
        // user.refreshTokens = [];
        await user.save();
    }
}
exports.authService = new AuthService();
