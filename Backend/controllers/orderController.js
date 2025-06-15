import Order from "../models/Order.js";
import Cart from "../models/cart.js";

export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get cart for the user
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      pickupTime,
      pickupLocationId,
      pickupLocationName,
      pickupAddress,
      notes,
    } = req.body;

    // Create the order
    const newOrder = new Order({
      userId,
      customerName,
      customerEmail,
      customerPhone,
      pickupTime,
      pickupLocationId,
      pickupLocationName,
      pickupAddress,
      notes,
      items: cart.items.map((item) => ({
        listingId: item.listingId,
        name: item.name,
        quantity: item.quantity,
        discountedPrice: item.discountedPrice,
      })),
    });

    await newOrder.save();

    // Clear cart after order
    cart.items = [];
    await cart.save();

    res.status(201).json({
  success: true,
  message: "Order placed",
  order: {
    id: newOrder._id.toString(),
    pickupLocationName: newOrder.pickupLocationName,
    pickupAddress: newOrder.pickupAddress,
    pickupTime: newOrder.pickupTime,
  },
});

  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
};
