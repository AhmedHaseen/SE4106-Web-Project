import dotenv from "dotenv";
dotenv.config();

import User from "../models/User.js";
import { connectDB } from "../config/db.js";

export const seedAdminUser = async () => {
  try {
    await connectDB();

    const adminEmail = "haseen2002hsn@gmail.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("Admin already exists:", existingAdmin.email);
      return;
    }

    
    const admin = new User({
      name: "Haseen (Admin)",
      email: adminEmail,
      password: "Hsn@2002",
      role: "admin",
    });

    await admin.save();

    console.log(" Admin user created:");
    console.log(" Email: haseen2002hsn@gmail.com");
    console.log(" Password: Hsn@2002");
  } catch (error) {
    console.error("Error seeding admin user:", error);
    process.exit(1);
  }
};
