import express from "express";
import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";
import { protect, customerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected and only for customers
router.use(protect, customerOnly);

router.get("/", getCart);
router.post("/", addToCart);
router.put("/:listingId", updateCartItemQuantity);
router.delete("/:listingId", removeFromCart);
router.delete("/", clearCart);

export default router;
