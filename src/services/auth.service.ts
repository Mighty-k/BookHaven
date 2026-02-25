import { User, IUser } from "../models/user.model";
import {
  generateTokens,
  TokenPayload,
  verifyRefreshToken,
} from "../utils/jwt.utils";
import crypto from "crypto";

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  async register(data: RegisterData): Promise<{
    user: IUser;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    // Check if user exists
    const existingUser = await User.findOne({
      email: data.email.toLowerCase(),
    });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    // Create user
    const user = new User({
      email: data.email.toLowerCase(),
      password: data.password,
      name: data.name,
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await user.save();

    // Generate tokens
    const payload: TokenPayload = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
    };
    const tokens = generateTokens(payload);

    // Save refresh token
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);
    user.refreshTokens.push({
      token: tokens.refreshToken,
      expiresAt: refreshTokenExpiry,
    });
    await user.save();

    // TODO: Send verification email
    console.log(
      `📧 Verification email would be sent to ${user.email} with token: ${verificationToken}`,
    );

    return { user, tokens };
  }

  async login(data: LoginData): Promise<{
    user: IUser;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    // Find user
    const user = await User.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockTime = user.lockUntil
        ? Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000)
        : 30;
      throw new Error(
        `Account is locked. Please try again in ${lockTime} minutes`,
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      throw new Error("Invalid email or password");
    }

    // Reset login attempts
    await user.resetLoginAttempts();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const payload: TokenPayload = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
    };
    const tokens = generateTokens(payload);

    // Save refresh token (keep only last 5)
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    const recentTokens = user.refreshTokens
      .sort((a, b) => b.expiresAt.getTime() - a.expiresAt.getTime())
      .slice(0, 4);

    recentTokens.push({
      token: tokens.refreshToken,
      expiresAt: refreshTokenExpiry,
    });

    user.refreshTokens = recentTokens;
    await user.save();

    return { user, tokens };
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify refresh token
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new Error("Invalid refresh token");
    }

    // Find user with this refresh token
    const user = await User.findOne({
      _id: payload.userId,
      "refreshTokens.token": refreshToken,
    });

    if (!user) {
      throw new Error("Refresh token not found");
    }

    // Remove the used refresh token
    user.refreshTokens = user.refreshTokens.filter(
      (rt) => rt.token !== refreshToken,
    );

    // Generate new tokens
    const newPayload: TokenPayload = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
    };
    const tokens = generateTokens(newPayload);

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

  async logout(userId: string, refreshToken: string): Promise<void> {
    await User.updateOne(
      { _id: userId },
      { $pull: { refreshTokens: { token: refreshToken } } },
    );
  }

  async logoutAll(userId: string): Promise<void> {
    await User.updateOne({ _id: userId }, { $set: { refreshTokens: [] } });
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new Error("Invalid or expired verification token");
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
  }

  async resendVerification(email: string): Promise<void> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new Error("User not found");
    }

    if (user.isEmailVerified) {
      throw new Error("Email already verified");
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    console.log(
      `📧 Verification email resent to ${user.email} with token: ${verificationToken}`,
    );
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal that user doesn't exist
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    console.log(
      `📧 Password reset email sent to ${user.email} with token: ${resetToken}`,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // Invalidate all sessions

    await user.save();
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    user.password = newPassword;
    await user.save();
  }

  async getProfile(userId: string): Promise<IUser | null> {
    return User.findById(userId).select(
      "-password -refreshTokens -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires",
    );
  }
}

export const authService = new AuthService();
