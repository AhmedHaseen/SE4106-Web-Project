import mongoose from "mongoose";

// Sub-schema for cart items
const cartItemSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessName: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    originalPrice: {
      type: Number,
      required: true,
    },
    discountedPrice: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    imageUrl: {
      type: String,
    },
    expiryDate: {
      type: Date,
    },
    pickupOnly: {
      type: Boolean,
      default: false,
    },
    pickupAddress: {
      type: String,
    },
  },
  { _id: false }
);

// Main cart schema
const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
