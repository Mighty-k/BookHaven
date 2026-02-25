import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { OrderController } from "../controllers/order.controller";

const router = Router();
const orderController = new OrderController();

// All routes require authentication
router.use(authenticate);

// User routes
router.post("/", orderController.createOrder);
router.get("/", orderController.getUserOrders);
router.get("/stats", orderController.getOrderStats);
router.get("/:orderId", orderController.getOrderById);
router.get("/number/:orderNumber", orderController.getOrderByNumber);
router.post("/:orderId/cancel", orderController.cancelOrder);

// Admin routes
router.get("/admin/all", authorize("admin"), orderController.getAllOrders);
router.patch(
  "/admin/:orderId/status",
  authorize("admin"),
  orderController.updateOrderStatus,
);
router.patch(
  "/admin/:orderId/payment",
  authorize("admin"),
  orderController.updatePaymentStatus,
);

export default router;
