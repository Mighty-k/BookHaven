import { Request, Response, NextFunction } from "express";
import { Order } from "../models/order.model";
import { User } from "../models/user.model";
import mongoose from "mongoose";

export class OrderController {
  // Helper function to generate order number
  private generateOrderNumber = (): string => {
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
  createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user._id;
      const {
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
      } = req.body;

      // Validate cart items
      if (!items || items.length === 0) {
        return res.status(400).json({ message: "Order must contain items" });
      }

      // Generate unique order number
      const orderNumber = this.generateOrderNumber(); // Now 'this' is correctly bound

      // Create order
      const order = new Order({
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
      await User.findByIdAndUpdate(userId, { $set: { cart: [] } });

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get user's orders
  getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user._id;
      const { page = 1, limit = 10, status } = req.query;

      const query: any = { userId };
      if (status) {
        query.orderStatus = status;
      }

      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await Order.countDocuments(query);

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
    } catch (error) {
      next(error);
    }
  };

  // Get single order by ID
  getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user._id;
      const { orderId } = req.params;

      const order = await Order.findOne({ _id: orderId, userId });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get order by order number
  getOrderByNumber = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = (req as any).user._id;
      const { orderNumber } = req.params;

      const order = await Order.findOne({ orderNumber, userId });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  // Cancel order
  cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user._id;
      const { orderId } = req.params;
      const { reason } = req.body;

      const order = await Order.findOne({ _id: orderId, userId });

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
    } catch (error) {
      next(error);
    }
  };

  // Get order statistics
  getOrderStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user._id;

      const stats = await Order.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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
    } catch (error) {
      next(error);
    }
  };

  // Admin: Get all orders
  getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        paymentStatus,
        startDate,
        endDate,
      } = req.query;

      const query: any = {};
      if (status) query.orderStatus = status;
      if (paymentStatus) query.paymentStatus = paymentStatus;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate as string);
        if (endDate) query.createdAt.$lte = new Date(endDate as string);
      }

      const orders = await Order.find(query)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await Order.countDocuments(query);

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
    } catch (error) {
      next(error);
    }
  };

  // Admin: Update order status
  updateOrderStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { orderId } = req.params;
      const { status, trackingNumber, estimatedDelivery, notes } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      order.orderStatus = status;
      if (trackingNumber) order.trackingNumber = trackingNumber;
      if (estimatedDelivery)
        order.estimatedDelivery = new Date(estimatedDelivery);
      if (notes) order.notes = notes;

      await order.save();

      res.json({
        success: true,
        message: "Order status updated",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  // Admin: Update payment status
  updatePaymentStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      const order = await Order.findById(orderId);
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
    } catch (error) {
      next(error);
    }
  };
}
