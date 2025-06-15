import express from "express";
import {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
} from "../controllers/listingController.js";
import {
  protect,
  requireBusinessOrAdmin,
  requireAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: get all listings (with optional query filters)
router.get("/", getAllListings);

// Public: get single listing by ID
router.get("/:id", getListingById);

// Protected: create new listing (only business or admin)
router.post("/", protect, requireBusinessOrAdmin, createListing);

// Protected: update listing (only business owning or admin)
router.put("/:id", protect, requireBusinessOrAdmin, updateListing);

// Protected: delete listing (only business owning or admin)
router.delete("/:id", protect, requireBusinessOrAdmin, deleteListing);

export default router;
