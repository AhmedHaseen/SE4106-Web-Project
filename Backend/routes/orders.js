import express from "express";
import { createOrder } from "../controllers/orderController.js";
import { protect, customerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only one route: create an order
router.post("/", protect, customerOnly, createOrder);

export default router;
