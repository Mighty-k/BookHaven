import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";

export class CartController {
  // Get user's cart
  async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const user = await User.findById(userId).select("cart");

      res.json({
        success: true,
        data: user?.cart || [],
      });
    } catch (error) {
      next(error);
    }
  }

  // Add item to cart
  async addToCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const { bookId, title, price, quantity = 1, coverImage } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if item already exists in cart
      const existingItemIndex = user.cart.findIndex(
        (item) => item.bookId === bookId,
      );

      if (existingItemIndex > -1) {
        // Update quantity
        user.cart[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        user.cart.push({
          bookId,
          title,
          price,
          quantity,
          coverImage,
          addedAt: new Date(),
        });
      }

      await user.save();

      res.json({
        success: true,
        message: "Item added to cart",
        data: user.cart,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update cart item quantity
  async updateQuantity(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const { bookId } = req.params;
      const { quantity } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const cartItem = user.cart.find((item) => item.bookId === bookId);
      if (!cartItem) {
        return res.status(404).json({ message: "Item not found in cart" });
      }

      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        user.cart = user.cart.filter((item) => item.bookId !== bookId);
      } else {
        cartItem.quantity = quantity;
      }

      await user.save();

      res.json({
        success: true,
        message: quantity <= 0 ? "Item removed from cart" : "Cart updated",
        data: user.cart,
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove item from cart
  async removeFromCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const { bookId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.cart = user.cart.filter((item) => item.bookId !== bookId);
      await user.save();

      res.json({
        success: true,
        message: "Item removed from cart",
        data: user.cart,
      });
    } catch (error) {
      next(error);
    }
  }

  // Clear entire cart
  async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.cart = [];
      await user.save();

      res.json({
        success: true,
        message: "Cart cleared",
        data: [],
      });
    } catch (error) {
      next(error);
    }
  }

  // Merge guest cart with user cart (after login)
  async mergeCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const { guestCart } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Merge guest cart items with existing cart
      for (const guestItem of guestCart) {
        const existingItem = user.cart.find(
          (item) => item.bookId === guestItem.bookId,
        );

        if (existingItem) {
          existingItem.quantity += guestItem.quantity;
        } else {
          user.cart.push({
            ...guestItem,
            addedAt: new Date(),
          });
        }
      }

      await user.save();

      res.json({
        success: true,
        message: "Cart merged successfully",
        data: user.cart,
      });
    } catch (error) {
      next(error);
    }
  }
}
