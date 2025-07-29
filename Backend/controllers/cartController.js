import asyncHandler from "express-async-handler";
import Cart from "../models/cart.js";

/*
   Get cart for logged-in user
*/
export const getCart = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || !user._id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const userId = user._id;
  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = new Cart({ userId, items: [] });
    await cart.save();
  }

  res.json({ success: true, cart });
});

/*
  Add item to cart
*/
export const addToCart = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || !user._id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const userId = user._id;

  const {
    listingId,
    businessId,
    businessName,
    name,
    originalPrice,
    discountedPrice,
    quantity,
    imageUrl,
    expiryDate,
    pickupOnly,
    pickupAddress,
  } = req.body;

  if (!listingId || !name || !originalPrice || !discountedPrice) {
    return res
      .status(400)
      .json({ success: false, message: "Missing listing details" });
  }

  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, items: [] });
  }

  const existingItem = cart.items.find(
    (item) => item.listingId.toString() === listingId
  );

  if (existingItem) {
    existingItem.quantity += quantity || 1;
  } else {
    cart.items.push({
      listingId,
      businessId,
      businessName,
      name,
      originalPrice,
      discountedPrice,
      quantity: quantity || 1,
      imageUrl,
      expiryDate,
      pickupOnly,
      pickupAddress,
    });
  }

  await cart.save();
  res.status(201).json({ success: true, message: "Item added to cart" });
});

/* 
 Update cart item quantity
*/
export const updateCartItemQuantity = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const listingId = req.params.listingId;
  const { quantity } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const cart = await Cart.findOne({ userId });

  if (!cart) {
    return res.status(404).json({ success: false, message: "Cart not found" });
  }

  const item = cart.items.find(
    (item) => item.listingId.toString() === listingId
  );

  if (!item) {
    return res.status(404).json({ success: false, message: "Item not found" });
  }

  item.quantity = quantity;
  await cart.save();

  res.json({ success: true, message: "Cart updated" });
});

/**
   Remove item from cart
*/
export const removeFromCart = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const listingId = req.params.listingId;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const cart = await Cart.findOne({ userId });

  if (!cart) {
    return res.status(404).json({ success: false, message: "Cart not found" });
  }

  cart.items = cart.items.filter(
    (item) => item.listingId.toString() !== listingId
  );

  await cart.save();
  res.json({ success: true, message: "Item removed from cart" });
});

/**
 * Clear cart
 */
export const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const cart = await Cart.findOne({ userId });

  if (cart) {
    cart.items = [];
    await cart.save();
  }

  res.json({ success: true, message: "Cart cleared" });
});
