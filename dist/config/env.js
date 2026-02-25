"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const getEnv = () => {
    const env = {
        PORT: parseInt(process.env.PORT || '3000', 10),
        NODE_ENV: process.env.NODE_ENV || 'development',
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore',
        JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-me',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-me',
        JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
        JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
        SMTP_HOST: process.env.SMTP_HOST || '',
        SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
        SMTP_USER: process.env.SMTP_USER || '',
        SMTP_PASS: process.env.SMTP_PASS || '',
        CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    };
    // Validate required env vars
    const requiredVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            console.warn(`Warning: ${varName} not set in environment`);
        }
    }
    return env;
};
exports.env = getEnv();
