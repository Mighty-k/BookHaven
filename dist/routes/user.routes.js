"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const cart_controller_1 = require("../controllers/cart.controller");
const wishlist_controller_1 = require("../controllers/wishlist.controller");
const address_controller_1 = require("../controllers/address.controller");
const router = (0, express_1.Router)();
const cartController = new cart_controller_1.CartController();
const wishlistController = new wishlist_controller_1.WishlistController();
const addressController = new address_controller_1.AddressController();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
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
router.patch("/addresses/:addressId/default", addressController.setDefaultAddress);
exports.default = router;
