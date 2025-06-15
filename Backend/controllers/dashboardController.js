
import Listing from "../models/Listing.js";

// GET /api/dashboard/stats
export const getDashboardStats = async (req, res) => {
  try {
    const user = req.user;

    if (!user || (user.role !== "business" && user.role !== "admin")) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const businessId = user._id;

    // Get active listings, pending orders, and all listings for this business
    const [activeListings, pendingOrders, totalListings] = await Promise.all([
      Listing.countDocuments({ businessId, status: "active" }),
      Order.countDocuments({ businessId, status: "pending" }),
      Listing.find({ businessId }),
    ]);

    // Total food saved = sum of quantities from all listings
    const foodSaved = totalListings.reduce((total, listing) => {
      return total + listing.quantity;
    }, 0);

    // Recent activity 
    const recentActivity = totalListings
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((listing) => ({
        type: "listing-created",
        message: `Created ${listing.foodName}`,
        timestamp: listing.createdAt,
      }));

    // Expiring soon = listings expiring in next 48 hours
    const now = new Date();
    const twoDaysLater = new Date();
    twoDaysLater.setDate(now.getDate() + 2);

    const expiringListings = await Listing.find({
      businessId,
      expiryDate: { $lte: twoDaysLater, $gte: now },
    }).sort({ expiryDate: 1 });

    res.json({
      success: true,
      stats: {
        activeListings,
        pendingOrders,
        foodSaved,
        recentActivity,
        expiringListings,
      },
    });
  } catch (error) {
    console.error("[Dashboard Controller] Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
