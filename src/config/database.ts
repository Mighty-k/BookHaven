import mongoose from "mongoose";
import { env } from "./env";

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Log available collections (for debugging)
    const collections = await conn.connection.db?.listCollections().toArray();
    console.log(
      "📚 Available collections:",
      collections?.map((c) => c.name),
    );
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on("disconnected", () => {
  console.log("🔌 MongoDB Disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("🔴 MongoDB Error:", err);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("👋 MongoDB connection closed through app termination");
  process.exit(0);
});
