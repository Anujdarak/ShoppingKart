const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const cors = require("cors");

const customerRoutes = require("./routes/customer.routes");
const productRoutes = require("./routes/product.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Root Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({
    status: "online",
    message: "ShopKart Backend Server is running successfully on port 3000",
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

// Routes
app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(process.env.PORT, () => {
       console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB connection error:", error);
  });