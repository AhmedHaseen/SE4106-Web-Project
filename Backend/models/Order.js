import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
  name: String,
  quantity: Number,
  discountedPrice: Number,
});

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customerName: String,
    customerEmail: String,
    customerPhone: String,
    items: [orderItemSchema],
    pickupLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    pickupLocationName: String,
    pickupAddress: String,
    pickupTime: Date,
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
