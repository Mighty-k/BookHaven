"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const mongoose_1 = __importDefault(require("mongoose"));
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const app = (0, express_1.default)();
// Connect to MongoDB
(0, database_1.connectDB)();
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://bookhaven-mocha.vercel.app",
    "https://www.bookhaven-mocha.vercel.app/",
];
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, morgan_1.default)("dev"));
// Routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/user", user_routes_1.default);
app.use("/api/orders", order_routes_1.default);
// Health check route
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        message: "BookHaven API is running",
        database: mongoose_1.default.connection.readyState === 1 ? "connected" : "disconnected",
        timestamp: new Date().toISOString(),
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});
// Error handler
app.use((err, req, res, next) => {
    console.error("❌ Error:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal server error",
        ...(env_1.env.NODE_ENV === "development" && { stack: err.stack }),
    });
});
// Start server
app.listen(env_1.env.PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${env_1.env.PORT}`);
    console.log(`📝 Environment: ${env_1.env.NODE_ENV}`);
    console.log(`🔗 Client URL: ${env_1.env.CLIENT_URL}`);
    console.log(`📚 API endpoints:`);
    console.log(`   - POST http://localhost:${env_1.env.PORT}/api/auth/register`);
    console.log(`   - POST http://localhost:${env_1.env.PORT}/api/auth/login`);
    console.log(`   - GET  http://localhost:${env_1.env.PORT}/health`);
    console.log(`   - POST http://localhost:${env_1.env.PORT}/api/orders`); // <-- Verify this shows up
});
exports.default = app;
