import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";

export class WishlistController {
  // GET /api/user/wishlist - Get all wishlist items
  async getWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const user = await User.findById(userId).select("wishlist");

      res.json({
        success: true,
        data: user?.wishlist || [],
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/user/wishlist - Add item to wishlist
  async addToWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const { bookId, title } = req.body;

      if (!bookId || !title) {
        return res.status(400).json({
          message: "bookId and title are required",
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if already in wishlist
      const exists = user.wishlist.some((item) => item.bookId === bookId);
      if (exists) {
        return res.status(400).json({ message: "Item already in wishlist" });
      }

      user.wishlist.push({
        bookId,
        title,
        addedAt: new Date(),
      });

      await user.save();

      res.status(201).json({
        success: true,
        message: "Added to wishlist",
        data: user.wishlist,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/user/wishlist/:bookId - Remove item from wishlist
  async removeFromWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const { bookId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const initialLength = user.wishlist.length;
      user.wishlist = user.wishlist.filter((item) => item.bookId !== bookId);

      if (user.wishlist.length === initialLength) {
        return res.status(404).json({ message: "Item not found in wishlist" });
      }

      await user.save();

      res.json({
        success: true,
        message: "Removed from wishlist",
        data: user.wishlist,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/user/wishlist/:bookId/move-to-cart - Move wishlist item to cart
  async moveToCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const { bookId } = req.params;
      const { price, coverImage } = req.body; // You might need to pass these from frontend

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Find the wishlist item
      const wishlistItem = user.wishlist.find((item) => item.bookId === bookId);
      if (!wishlistItem) {
        return res.status(404).json({ message: "Item not found in wishlist" });
      }

      // Add to cart
      const cartItem = {
        bookId: wishlistItem.bookId,
        title: wishlistItem.title,
        price: price || 14.99, // You might want to fetch actual price from books service
        quantity: 1,
        coverImage: coverImage || "",
        addedAt: new Date(),
      };

      // Check if already in cart
      const existingCartItem = user.cart.find((item) => item.bookId === bookId);
      if (existingCartItem) {
        existingCartItem.quantity += 1;
      } else {
        user.cart.push(cartItem);
      }

      // Remove from wishlist
      user.wishlist = user.wishlist.filter((item) => item.bookId !== bookId);

      await user.save();

      res.json({
        success: true,
        message: "Moved to cart",
        data: {
          wishlist: user.wishlist,
          cart: user.cart,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/user/wishlist - Clear entire wishlist
  async clearWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.wishlist = [];
      await user.save();

      res.json({
        success: true,
        message: "Wishlist cleared",
        data: [],
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/user/wishlist/count - Get wishlist count (optional)
  async getWishlistCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const user = await User.findById(userId).select("wishlist");

      res.json({
        success: true,
        data: {
          count: user?.wishlist.length || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
