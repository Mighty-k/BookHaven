import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import { connectDB } from "./config/database";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import orderRoutes from "./routes/order.routes";

const app = express();

// Connect to MongoDB
connectDB();
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://bookhaven-mocha.vercel.app",
  "https://www.bookhaven-mocha.vercel.app/",
];
// Middleware
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/orders", orderRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "BookHaven API is running",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("❌ Error:", err);
    res.status(err.status || 500).json({
      message: err.message || "Internal server error",
      ...(env.NODE_ENV === "development" && { stack: err.stack }),
    });
  },
);

// Start server
app.listen(env.PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${env.PORT}`);
  console.log(`📝 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Client URL: ${env.CLIENT_URL}`);
  console.log(`📚 API endpoints:`);
  console.log(`   - POST http://localhost:${env.PORT}/api/auth/register`);
  console.log(`   - POST http://localhost:${env.PORT}/api/auth/login`);
  console.log(`   - GET  http://localhost:${env.PORT}/health`);
  console.log(`   - POST http://localhost:${env.PORT}/api/orders`); // <-- Verify this shows up
});

export default app;
