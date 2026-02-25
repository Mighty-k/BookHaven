import mongoose, { Document, Schema, CallbackError } from "mongoose";
import { comparePassword, hashPassword } from "../utils/password.utils";

export interface CartItem {
  bookId: string;
  title: string;
  price: number;
  quantity: number;
  coverImage: string;
  addedAt: Date;
}

export interface WishlistItem {
  bookId: string;
  title: string;
  addedAt: Date;
}

export interface Address {
  fullName: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}
export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: "customer" | "admin";
  avatar?: string;
  isEmailVerified: boolean;
  cart: CartItem[];
  wishlist: WishlistItem[];
  addresses: Address[];
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: Array<{
    token: string;
    expiresAt: Date;
  }>;
  loginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    avatar: String,
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    cart: [
      {
        bookId: { type: String, required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        coverImage: String,
        addedAt: { type: Date, default: Date.now },
      },
    ],

    wishlist: [
      {
        bookId: { type: String, required: true },
        title: String,
        addedAt: { type: Date, default: Date.now },
      },
    ],

    addresses: [
      {
        fullName: { type: String, required: true },
        street: { type: String, required: true },
        apartment: String,
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true, default: "United States" },
        phone: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshTokens: [
      {
        token: String,
        expiresAt: Date,
      },
    ],
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    lastLogin: Date,
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre("save", async function (this: IUser) {
  try {
    // Only hash if password is modified
    if (!this.isModified("password")) {
      return;
    }

    const hashedPassword = await hashPassword(this.password);
    this.password = hashedPassword;
  } catch (error) {
    throw error as CallbackError;
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return comparePassword(candidatePassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < new Date()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
    await this.save(); // No arguments needed
    return;
  }

  this.loginAttempts += 1;

  // Lock account after 5 failed attempts
  if (this.loginAttempts >= 5 && !this.isLocked()) {
    const lockTime = 30 * 60 * 1000; // 30 minutes
    this.lockUntil = new Date(Date.now() + lockTime);
  }

  await this.save(); // No arguments needed
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save(); // No arguments needed
};

userSchema.methods.getAddressById = function (addressId: string) {
  return (this.addresses as any[]).find(
    (addr) => addr._id && addr._id.toString() === addressId,
  );
};

userSchema.methods.getAddressIndex = function (addressId: string) {
  return (this.addresses as any[]).findIndex(
    (addr) => addr._id && addr._id.toString() === addressId,
  );
};

export const User = mongoose.model<IUser>("User", userSchema);
