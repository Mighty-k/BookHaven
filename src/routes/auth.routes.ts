import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  resetPasswordValidation,
  emailValidation,
} from "../validations/auth.validation";
import { User } from "../models/user.model";
import { generateTokens } from "../utils/jwt.utils";
import mongoose from "mongoose";

const getIdAsString = (id: any): string => {
  if (id instanceof mongoose.Types.ObjectId) {
    return id.toString();
  }
  return String(id);
};

const router = Router();
const authController = new AuthController();

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);

// Public routes
router.post("/register", registerValidation, validate, authController.register);
router.post("/login", loginValidation, validate, authController.login);
router.post("/refresh-token", authController.refreshToken);
router.get("/verify-email/:token", authController.verifyEmail);
router.post(
  "/resend-verification",
  emailValidation,
  validate,
  authController.resendVerification,
);
router.post(
  "/forgot-password",
  emailValidation,
  validate,
  authController.forgotPassword,
);
router.post(
  "/reset-password/:token",
  resetPasswordValidation,
  validate,
  authController.resetPassword,
);

// Google OAuth route
router.post("/google", async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    // Find or create user
    let user = await User.findOne({ email: payload.email });

    if (!user) {
      // Create new user from Google data
      user = new User({
        email: payload.email,
        name: payload.name || "Google User",
        password: Math.random().toString(36), // Random password (user will use Google to login)
        isEmailVerified: payload.email_verified || false,
        avatar: payload.picture,
        role: "customer",
      });
      await user.save();
    }

    // Convert ObjectId to string safely
    const userId =
      user._id instanceof mongoose.Types.ObjectId
        ? user._id.toString()
        : String(user._id);

    // Generate tokens
    const tokens = generateTokens({
      userId: userId, // Now it's a string
      email: user.email,
      role: user.role,
    });

    // Save refresh token
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);
    user.refreshTokens.push({
      token: tokens.refreshToken,
      expiresAt: refreshTokenExpiry,
    });
    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: userId, // Use the converted string ID
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
        },
        tokens,
      },
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    next(error);
  }
});

// Protected routes
router.use(authenticate);
router.post("/logout", authController.logout);
router.post("/logout-all", authController.logoutAll);
router.post(
  "/change-password",
  changePasswordValidation,
  validate,
  authController.changePassword,
);
router.get("/profile", authController.getProfile);

export default router;
