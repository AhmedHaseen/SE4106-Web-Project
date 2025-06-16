import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessName: {
      type: String,
      required: true,
    },
    foodName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      enum: ["meals", "bakery", "produce", "dairy", "other"],
      default: "other",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    pickupOnly: {
      type: Boolean,
      default: false,
    },
    pickupAddress: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "sold-out", "expired"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Automatically mark expired listings
listingSchema.pre("save", function (next) {
  if (this.expiryDate < new Date()) {
    this.status = "expired";
  }
  next();
});

const Listing = mongoose.model("Listing", listingSchema);
export default Listing;
