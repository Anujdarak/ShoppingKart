const express = require("express");
const {
  addToCart,
  getCart,
  updateQuantity,
  removeFromCart
} = require("../controllers/cart.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// All cart routes are protected by authMiddleware
router.post("/:productId", authMiddleware, addToCart);
router.get("/", authMiddleware, getCart);
router.patch("/:productId", authMiddleware, updateQuantity);
router.delete("/:productId", authMiddleware, removeFromCart);

module.exports = router;
