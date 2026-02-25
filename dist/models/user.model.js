"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const password_utils_1 = require("../utils/password.utils");
const userSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
});
// Hash password before saving
userSchema.pre("save", async function () {
    try {
        // Only hash if password is modified
        if (!this.isModified("password")) {
            return;
        }
        const hashedPassword = await (0, password_utils_1.hashPassword)(this.password);
        this.password = hashedPassword;
    }
    catch (error) {
        throw error;
    }
});
// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return (0, password_utils_1.comparePassword)(candidatePassword, this.password);
};
// Check if account is locked
userSchema.methods.isLocked = function () {
    return !!(this.lockUntil && this.lockUntil > new Date());
};
// Increment login attempts
userSchema.methods.incrementLoginAttempts = async function () {
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
userSchema.methods.resetLoginAttempts = async function () {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    await this.save(); // No arguments needed
};
userSchema.methods.getAddressById = function (addressId) {
    return this.addresses.find((addr) => addr._id && addr._id.toString() === addressId);
};
userSchema.methods.getAddressIndex = function (addressId) {
    return this.addresses.findIndex((addr) => addr._id && addr._id.toString() === addressId);
};
exports.User = mongoose_1.default.model("User", userSchema);
