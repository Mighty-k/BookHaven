"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    console.error("❌ Error:", err);
    // Default error
    let status = err.status || 500;
    let message = err.message || "Internal server error";
    // Handle specific errors
    if (err.name === "ValidationError") {
        status = 400;
        message = "Validation error";
    }
    if (err.name === "JsonWebTokenError") {
        status = 401;
        message = "Invalid token";
    }
    if (err.name === "TokenExpiredError") {
        status = 401;
        message = "Token expired";
    }
    if (err.name === "MongoServerError" && err.code === 11000) {
        status = 409;
        message = "Duplicate entry";
    }
    res.status(status).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
