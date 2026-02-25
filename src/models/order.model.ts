import mongoose, { Document, Schema } from "mongoose";

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  orderNumber: string; // Still required, but we'll set it in controller
  items: Array<{
    bookId: string;
    title: string;
    price: number;
    quantity: number;
    coverImage: string;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  discount?: number;
  promoCode?: string;
  shippingAddress: {
    fullName: string;
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  billingAddress: {
    fullName: string;
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: {
    type: "card" | "bank_transfer" | "paypal";
    last4?: string;
    brand?: string;
  };
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  orderStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  trackingNumber?: string;
  estimatedDelivery?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: [
      {
        bookId: { type: String, required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        coverImage: String,
      },
    ],
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    shipping: { type: Number, required: true },
    total: { type: Number, required: true },
    discount: Number,
    promoCode: String,
    shippingAddress: {
      fullName: { type: String, required: true },
      street: { type: String, required: true },
      apartment: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true },
    },
    billingAddress: {
      fullName: { type: String, required: true },
      street: { type: String, required: true },
      apartment: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true },
    },
    paymentMethod: {
      type: {
        type: String,
        enum: ["card", "bank_transfer", "paypal"],
        required: true,
      },
      last4: String,
      brand: String,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    trackingNumber: String,
    estimatedDelivery: Date,
    notes: String,
  },
  {
    timestamps: true,
  },
);

// REMOVE ALL PRE-SAVE HOOKS - we'll generate orderNumber in controller

export const Order = mongoose.model<IOrder>("Order", orderSchema);
