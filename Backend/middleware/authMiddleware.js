
import jwt from "jsonwebtoken";
import User from "../models/User.js";

//  Middleware to protect private routes
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({ success: false, message: "User not found" });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error.message);
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
  } else {
    return res.status(401).json({ success: false, message: "No token provided" });
  }
};

//  Allow only customers
export const customerOnly = (req, res, next) => {
  if (req.user && req.user.role === "customer") {
    return next();
  }

  return res.status(403).json({ success: false, message: "Access denied (Customers only)" });
};

//  Allow only businesses and admins
export const requireBusinessOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "business" || req.user.role === "admin")) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied (Business or Admin only)",
  });
};

//  Allow only admins
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({ success: false, message: "Admin access required" });
};
