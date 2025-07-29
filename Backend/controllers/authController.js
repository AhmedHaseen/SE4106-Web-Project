// /SaveBite-backend/controllers/authController.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

//    Register a new user

export const register = async (req, res) => {
  const { name, email, password, role, businessName, businessType } = req.body;

  // Simple validation
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  // Check if user already exists
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ success: false, message: "Email already registered" });
  }

  // Create new user
  const userData = { name, email: email.toLowerCase(), password, role };
  if (role === "business") {
    userData.businessName = businessName || "";
    userData.businessType = businessType || "";
  }

  const user = await User.create(userData);

  if (user) {
    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        businessType: user.businessType,
      },
    });
  } else {
    res.status(400).json({ success: false, message: "Invalid user data" });
  }
};

//    Authenticate user & get token

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  console.log("🔍 User trying to login:", user); 

  if (user && (await user.matchPassword(password))) {
    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        businessType: user.businessType,
      },
    });
  } else {
    res.status(401).json({ success: false, message: "Invalid email or password" });
  }
};

//    Get current logged-in user data

export const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(404).json({ success: false, message: "User not found" });
  }
};
