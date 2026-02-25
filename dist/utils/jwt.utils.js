"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePasswordResetToken = exports.generateEmailVerificationToken = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const generateTokens = (user) => {
    const payload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
    };
    const accessTokenOptions = {
        expiresIn: env_1.env.JWT_ACCESS_EXPIRY,
    };
    const refreshTokenOptions = {
        expiresIn: env_1.env.JWT_REFRESH_EXPIRY,
    };
    const accessToken = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, accessTokenOptions);
    const refreshToken = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, refreshTokenOptions);
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
};
exports.verifyRefreshToken = verifyRefreshToken;
const generateEmailVerificationToken = () => {
    return jsonwebtoken_1.default.sign({ type: "email-verification" }, env_1.env.JWT_SECRET, {
        expiresIn: "24h",
    });
};
exports.generateEmailVerificationToken = generateEmailVerificationToken;
const generatePasswordResetToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId, type: "password-reset" }, env_1.env.JWT_SECRET, { expiresIn: "1h" });
};
exports.generatePasswordResetToken = generatePasswordResetToken;
