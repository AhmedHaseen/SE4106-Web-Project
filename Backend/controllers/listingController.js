
import Listing from "../models/Listing.js";

/*
   Get all listings with optional filters: search, category, sortBy, businessId
 */
export const getAllListings = async (req, res) => {
  try {
    const { search, category, sortBy, businessId } = req.query;
    let filter = {};

    // Only “active” by default for public browsing
    if (!businessId) {
      filter.status = "active";
    }

    if (businessId) {
      filter.businessId = businessId;
    }

    // Category filter
    if (category && category !== "all") {
      filter.category = category;
    }

    // Search by foodName or businessName
    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ foodName: { $regex: regex } }, { businessName: { $regex: regex } }];
    }

    // Sorting
    let sortOption = {};
    if (sortBy === "expiry") {
      sortOption.expiryDate = 1;
    } else if (sortBy === "price-asc") {
      sortOption.discountedPrice = 1;
    } else if (sortBy === "price-desc") {
      sortOption.discountedPrice = -1;
    } else if (sortBy === "discount") {
      // will handle in aggregation
      sortOption = null;
    }

    let listings;
    if (sortBy === "discount") {
      // Aggregate to compute discount percent
      listings = await Listing.aggregate([
        { $match: filter },
        {
          $addFields: {
            discountPercent: {
              $multiply: [
                {
                  $divide: [
                    { $subtract: ["$originalPrice", "$discountedPrice"] },
                    "$originalPrice",
                  ],
                },
                100,
              ],
            },
          },
        },
        { $sort: { discountPercent: -1 } },
      ]);
      // returns plain JS objects with all fields
    } else {
      listings = await Listing.find(filter).sort(sortOption).exec();
    }

    return res.json({ success: true, listings });
  } catch (error) {
    console.error("Error in getAllListings:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/*
 Get a single listing by ID
 */
export const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).exec();
    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }
    return res.json({ success: true, listing });
  } catch (error) {
    console.error("Error in getListingById:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/*
    Create a new listing
 */
export const createListing = async (req, res) => {
  try {
    const {
      foodName,
      description,
      category,
      quantity,
      originalPrice,
      discountedPrice,
      expiryDate,
      imageUrl,
      pickupOnly,
      pickupAddress,
    } = req.body;

    if (!foodName || !quantity || !originalPrice || !discountedPrice || !expiryDate) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Build listing data
    const newListing = new Listing({
      businessId: req.user._id,
      businessName: req.user.businessName || req.user.name,
      foodName,
      description: description || "",
      category: category || "other",
      quantity,
      originalPrice,
      discountedPrice,
      expiryDate,
      imageUrl: imageUrl || "",
      pickupOnly: pickupOnly || false,
      pickupAddress: pickupAddress || "",
    });

    const saved = await newListing.save();
    return res.status(201).json({ success: true, listing: saved });
  } catch (error) {
    console.error("Error in createListing:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/*  
 Update an existing listing
 */
export const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).exec();
    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    // Only the business who owns it or an admin can update
    if (
      listing.businessId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Update fields if provided
    const fieldsToUpdate = [
      "foodName",
      "description",
      "category",
      "quantity",
      "originalPrice",
      "discountedPrice",
      "expiryDate",
      "imageUrl",
      "pickupOnly",
      "pickupAddress",
    ];
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        listing[field] = req.body[field];
      }
    });

    const updated = await listing.save();
    return res.json({ success: true, listing: updated });
  } catch (error) {
    console.error("Error in updateListing:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/*
 Delete an existing listing
 */
export const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).exec();
    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    if (
      listing.businessId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await listing.remove();
    return res.json({ success: true, message: "Listing deleted" });
  } catch (error) {
    console.error("Error in deleteListing:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
