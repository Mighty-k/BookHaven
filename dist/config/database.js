"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(env_1.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        // Log available collections (for debugging)
        const collections = await conn.connection.db?.listCollections().toArray();
        console.log("📚 Available collections:", collections?.map((c) => c.name));
    }
    catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
// Handle connection events
mongoose_1.default.connection.on("disconnected", () => {
    console.log("🔌 MongoDB Disconnected");
});
mongoose_1.default.connection.on("error", (err) => {
    console.error("🔴 MongoDB Error:", err);
});
// Graceful shutdown
process.on("SIGINT", async () => {
    await mongoose_1.default.connection.close();
    console.log("👋 MongoDB connection closed through app termination");
    process.exit(0);
});
