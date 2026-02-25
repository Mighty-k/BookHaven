"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const order_controller_1 = require("../controllers/order.controller");
const router = (0, express_1.Router)();
const orderController = new order_controller_1.OrderController();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// User routes
router.post("/", orderController.createOrder);
router.get("/", orderController.getUserOrders);
router.get("/stats", orderController.getOrderStats);
router.get("/:orderId", orderController.getOrderById);
router.get("/number/:orderNumber", orderController.getOrderByNumber);
router.post("/:orderId/cancel", orderController.cancelOrder);
// Admin routes
router.get("/admin/all", (0, auth_middleware_1.authorize)("admin"), orderController.getAllOrders);
router.patch("/admin/:orderId/status", (0, auth_middleware_1.authorize)("admin"), orderController.updateOrderStatus);
router.patch("/admin/:orderId/payment", (0, auth_middleware_1.authorize)("admin"), orderController.updatePaymentStatus);
exports.default = router;
