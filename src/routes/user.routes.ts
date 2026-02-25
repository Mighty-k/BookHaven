import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { CartController } from "../controllers/cart.controller";
import { WishlistController } from "../controllers/wishlist.controller";
import { AddressController } from "../controllers/address.controller";

const router = Router();
const cartController = new CartController();
const wishlistController = new WishlistController();
const addressController = new AddressController();

// All routes require authentication
router.use(authenticate);

// Cart routes
router.get("/cart", cartController.getCart);
router.post("/cart", cartController.addToCart);
router.put("/cart/:bookId", cartController.updateQuantity);
router.delete("/cart/:bookId", cartController.removeFromCart);
router.delete("/cart", cartController.clearCart);
router.post("/cart/merge", cartController.mergeCart);

// Wishlist routes
router.get("/wishlist", wishlistController.getWishlist);
router.get("/wishlist/count", wishlistController.getWishlistCount); // Optional
router.post("/wishlist", wishlistController.addToWishlist);
router.delete("/wishlist/:bookId", wishlistController.removeFromWishlist);
router.post("/wishlist/:bookId/move-to-cart", wishlistController.moveToCart);
router.delete("/wishlist", wishlistController.clearWishlist);

// Address routes
router.get("/addresses", addressController.getAddresses);
router.post("/addresses", addressController.addAddress);
router.put("/addresses/:addressId", addressController.updateAddress);
router.delete("/addresses/:addressId", addressController.deleteAddress);
router.patch(
  "/addresses/:addressId/default",
  addressController.setDefaultAddress,
);

export default router;
