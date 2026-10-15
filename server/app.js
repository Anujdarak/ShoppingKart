require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectToDatabase = require("../config/database");

const customerRoutes = require("../routes/customer.routes");
const productRoutes = require("../routes/product.routes");
const wishlistRoutes = require("../routes/wishlist.routes");
const cartRoutes = require("../routes/cart.routes");
const orderRoutes = require("../routes/order.routes");

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error("MongoDB connection error:", error);
    res.status(503).json({
      status: "error",
      message: "Database unavailable"
    });
  }
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: "online",
    message: "ShopKart Backend Server is running successfully",
    endpoints: {
      health: "/",
      customers: {
        register: "POST /customers/register",
        login: "POST /customers/login",
        me: "GET /customers/me",
        logout: "POST /customers/logout"
      },
      products: {
        getAll: "GET /products",
        getOne: "GET /products/:id",
        create: "POST /products"
      },
      wishlist: {
        get: "GET /wishlist",
        add: "POST /wishlist/:productId",
        remove: "DELETE /wishlist/:productId",
        toggle: "PATCH /wishlist/:productId/toggle"
      },
      cart: {
        get: "GET /cart",
        add: "POST /cart/:productId",
        updateQuantity: "PATCH /cart/:productId",
        remove: "DELETE /cart/:productId"
      }
    }
  });
});

app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);

module.exports = app;
