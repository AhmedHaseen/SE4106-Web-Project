import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();

//  CONNECT TO MONGODB & SEED ADMIN
//  call connectDB(), then seed the admin user beforestart listening.
connectDB()
  .then(async () => {
    // Dynamically import seedAdminUser as a named export
    const { seedAdminUser } = await import("./utils/seedAdmin.js");
    await seedAdminUser(); // create admin if missing

    console.log(" MongoDB connected and admin seeded.");
  })
  .catch((err) => {
    console.error(" Failed to connect to DB:", err);
    process.exit(1);
  });

// MIDDLEWARE 
app.use(express.json());        // parse JSON bodies
app.use(cors());                // enable CORS for all routes
app.use(morgan("dev"));         // log incoming requests

//  ROUTES
import authRoutes from "./routes/auth.js";
import listingsRoutes from "./routes/listings.js";
import dashboardRoutes from "./routes/dashboard.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

//  Check api connection
app.get("/", (req, res) => {
  res.send(" SaveBite API is running...");
});

// 404 HANDLER
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint not found" });
});

//START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server listening on port ${PORT}`);
});
