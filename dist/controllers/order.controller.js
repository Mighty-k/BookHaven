"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const order_model_1 = require("../models/order.model");
const user_model_1 = require("../models/user.model");
const mongoose_1 = __importDefault(require("mongoose"));
class OrderController {
    constructor() {
        // Helper function to generate order number
        this.generateOrderNumber = () => {
            const date = new Date();
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const day = date.getDate().toString().padStart(2, "0");
            const random = Math.floor(Math.random() * 10000)
                .toString()
                .padStart(4, "0");
            return `ORD-${year}${month}${day}-${random}`;
        };
        // Create new order - use arrow function
        this.createOrder = async (req, res, next) => {
            try {
                const userId = req.user._id;
                const { items, subtotal, tax, shipping, total, discount, promoCode, shippingAddress, billingAddress, paymentMethod, notes, } = req.body;
                // Validate cart items
                if (!items || items.length === 0) {
                    return res.status(400).json({ message: "Order must contain items" });
                }
                // Generate unique order number
                const orderNumber = this.generateOrderNumber(); // Now 'this' is correctly bound
                // Create order
                const order = new order_model_1.Order({
                    orderNumber,
                    userId: userId.toString(), // Ensure userId is string
                    items,
                    subtotal,
                    tax,
                    shipping,
                    total,
                    discount,
                    promoCode,
                    shippingAddress,
                    billingAddress,
                    paymentMethod,
                    notes,
                    paymentStatus: "pending",
                    orderStatus: "pending",
                });
                await order.save();
                // Clear user's cart after successful order
                await user_model_1.User.findByIdAndUpdate(userId, { $set: { cart: [] } });
                res.status(201).json({
                    success: true,
                    message: "Order created successfully",
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        };
        // Get user's orders
        this.getUserOrders = async (req, res, next) => {
            try {
                const userId = req.user._id;
                const { page = 1, limit = 10, status } = req.query;
                const query = { userId };
                if (status) {
                    query.orderStatus = status;
                }
                const orders = await order_model_1.Order.find(query)
                    .sort({ createdAt: -1 })
                    .skip((Number(page) - 1) * Number(limit))
                    .limit(Number(limit));
                const total = await order_model_1.Order.countDocuments(query);
                res.json({
                    success: true,
                    data: orders,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total,
                        pages: Math.ceil(total / Number(limit)),
                    },
                });
            }
            catch (error) {
                next(error);
            }
        };
        // Get single order by ID
        this.getOrderById = async (req, res, next) => {
            try {
                const userId = req.user._id;
                const { orderId } = req.params;
                const order = await order_model_1.Order.findOne({ _id: orderId, userId });
                if (!order) {
                    return res.status(404).json({ message: "Order not found" });
                }
                res.json({
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        };
        // Get order by order number
        this.getOrderByNumber = async (req, res, next) => {
            try {
                const userId = req.user._id;
                const { orderNumber } = req.params;
                const order = await order_model_1.Order.findOne({ orderNumber, userId });
                if (!order) {
                    return res.status(404).json({ message: "Order not found" });
                }
                res.json({
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        };
        // Cancel order
        this.cancelOrder = async (req, res, next) => {
            try {
                const userId = req.user._id;
                const { orderId } = req.params;
                const { reason } = req.body;
                const order = await order_model_1.Order.findOne({ _id: orderId, userId });
                if (!order) {
                    return res.status(404).json({ message: "Order not found" });
                }
                // Check if order can be cancelled
                if (!["pending", "processing"].includes(order.orderStatus)) {
                    return res.status(400).json({
                        message: `Order cannot be cancelled because it is ${order.orderStatus}`,
                    });
                }
                order.orderStatus = "cancelled";
                order.notes = reason ? `Cancelled: ${reason}` : "Order cancelled by user";
                await order.save();
                res.json({
                    success: true,
                    message: "Order cancelled successfully",
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        };
        // Get order statistics
        this.getOrderStats = async (req, res, next) => {
            try {
                const userId = req.user._id;
                const stats = await order_model_1.Order.aggregate([
                    { $match: { userId: new mongoose_1.default.Types.ObjectId(userId) } },
                    {
                        $group: {
                            _id: null,
                            totalOrders: { $sum: 1 },
                            totalSpent: { $sum: "$total" },
                            averageOrderValue: { $avg: "$total" },
                            pendingOrders: {
                                $sum: { $cond: [{ $eq: ["$orderStatus", "pending"] }, 1, 0] },
                            },
                            deliveredOrders: {
                                $sum: { $cond: [{ $eq: ["$orderStatus", "delivered"] }, 1, 0] },
                            },
                        },
                    },
                ]);
                res.json({
                    success: true,
                    data: stats[0] || {
                        totalOrders: 0,
                        totalSpent: 0,
                        averageOrderValue: 0,
                        pendingOrders: 0,
                        deliveredOrders: 0,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        };
        // Admin: Get all orders
        this.getAllOrders = async (req, res, next) => {
            try {
                const { page = 1, limit = 20, status, paymentStatus, startDate, endDate, } = req.query;
                const query = {};
                if (status)
                    query.orderStatus = status;
                if (paymentStatus)
                    query.paymentStatus = paymentStatus;
                if (startDate || endDate) {
                    query.createdAt = {};
                    if (startDate)
                        query.createdAt.$gte = new Date(startDate);
                    if (endDate)
                        query.createdAt.$lte = new Date(endDate);
                }
                const orders = await order_model_1.Order.find(query)
                    .populate("userId", "name email")
                    .sort({ createdAt: -1 })
                    .skip((Number(page) - 1) * Number(limit))
                    .limit(Number(limit));
                const total = await order_model_1.Order.countDocuments(query);
                res.json({
                    success: true,
                    data: orders,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total,
                        pages: Math.ceil(total / Number(limit)),
                    },
                });
            }
            catch (error) {
                next(error);
            }
        };
        // Admin: Update order status
        this.updateOrderStatus = async (req, res, next) => {
            try {
                const { orderId } = req.params;
                const { status, trackingNumber, estimatedDelivery, notes } = req.body;
                const order = await order_model_1.Order.findById(orderId);
                if (!order) {
                    return res.status(404).json({ message: "Order not found" });
                }
                order.orderStatus = status;
                if (trackingNumber)
                    order.trackingNumber = trackingNumber;
                if (estimatedDelivery)
                    order.estimatedDelivery = new Date(estimatedDelivery);
                if (notes)
                    order.notes = notes;
                await order.save();
                res.json({
                    success: true,
                    message: "Order status updated",
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        };
        // Admin: Update payment status
        this.updatePaymentStatus = async (req, res, next) => {
            try {
                const { orderId } = req.params;
                const { status } = req.body;
                const order = await order_model_1.Order.findById(orderId);
                if (!order) {
                    return res.status(404).json({ message: "Order not found" });
                }
                order.paymentStatus = status;
                await order.save();
                res.json({
                    success: true,
                    message: "Payment status updated",
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        };
    }
}
exports.OrderController = OrderController;
