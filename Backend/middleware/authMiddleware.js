// authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware to protect private routes
export const protect = async (req, res, next) => {
  let token;

  // ✅ Extract token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];

    try {
      // ✅ Decode the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ Find user from decoded token
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        console.warn("[AuthMiddleware] No user found for decoded token.");
        return res.status(401).json({ success: false, message: "User not found" });
      }

      // ✅ Attach full user (with _id) to req.user
      req.user = user;

      // ✅ Log actual object for verification
      console.log("[AuthMiddleware] Authenticated user:", {
        _id: user._id,
        role: user.role,
        email: user.email,
      });

      next();
    } catch (error) {
      console.error("[AuthMiddleware] Invalid token:", error.message);
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
  } else {
    console.warn("[AuthMiddleware] No token provided");
    return res.status(401).json({ success: false, message: "No token provided" });
  }
};

// ✅ Customers only
export const customerOnly = (req, res, next) => {
  if (req.user && req.user.role === "customer") {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied (Customers only)",
  });
};

// ✅ Businesses or Admins
export const requireBusinessOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "business" || req.user.role === "admin")) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied (Business or Admin only)",
  });
};

// ✅ Admins only
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({ success: false, message: "Admin access required" });
};
