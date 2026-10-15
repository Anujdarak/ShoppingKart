const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// ADD PRODUCT TO CART - POST /cart/:productId
const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format"
      });
    }

    const cleanProductId = productId.toString().trim();

    // Find Product in catalog
    const product = await Product.findById(cleanProductId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Find authenticated Customer
    const customer = await Customer.findById(req.user);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    if (!customer.cart) {
      customer.cart = [];
    }

    // Check if product already exists in user's cart
    const existingIndex = customer.cart.findIndex(
      (item) => (item.product._id ? item.product._id.toString() : item.product.toString()).trim() === cleanProductId
    );

    const newQuantity = existingIndex > -1 ? customer.cart[existingIndex].quantity + 1 : 1;

    // Validate available stock
    if (newQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: "Cannot add more items than available in stock"
      });
    }

    // Update existing row or push new row
    if (existingIndex > -1) {
      customer.cart[existingIndex].quantity = newQuantity;
    } else {
      customer.cart.push({
        product: cleanProductId,
        quantity: 1
      });
    }

    await customer.save();

    // Populate updated cart
    await customer.populate({
      path: "cart.product",
      select: "name price image stock category description"
    });

    const cart = (customer.cart || []).filter((item) => item && item.product);

    return res.status(200).json({
      success: true,
      message: "Product added to cart",
      cart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while adding to cart"
    });
  }
};

// GET CURRENT USER'S CART - GET /cart
const getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user).populate({
      path: "cart.product",
      select: "name price image stock category description"
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    // Filter out dangling references if a product was deleted from catalog
    const cart = (customer.cart || []).filter((item) => item && item.product);

    return res.status(200).json({
      success: true,
      cart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching cart"
    });
  }
};

// UPDATE CART ITEM QUANTITY - PATCH /cart/:productId
const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format"
      });
    }

    // Validate quantity is a valid number
    if (quantity === undefined || quantity === null || isNaN(Number(quantity))) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required"
      });
    }

    const numQuantity = Number(quantity);

    // Quantity cannot be less than 1
    if (numQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1"
      });
    }

    const cleanProductId = productId.toString().trim();

    // Find Product in catalog
    const product = await Product.findById(cleanProductId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Check requested quantity against stock
    if (numQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: "Quantity exceeds available stock"
      });
    }

    // Find authenticated customer
    const customer = await Customer.findById(req.user);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    if (!customer.cart) {
      customer.cart = [];
    }

    // Check if product exists in cart
    const existingIndex = customer.cart.findIndex(
      (item) => (item.product._id ? item.product._id.toString() : item.product.toString()).trim() === cleanProductId
    );

    if (existingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart"
      });
    }

    customer.cart[existingIndex].quantity = numQuantity;
    await customer.save();

    await customer.populate({
      path: "cart.product",
      select: "name price image stock category description"
    });

    const cart = (customer.cart || []).filter((item) => item && item.product);

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      cart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while updating cart quantity"
    });
  }
};

// REMOVE PRODUCT FROM CART - DELETE /cart/:productId
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format"
      });
    }

    const cleanProductId = productId.toString().trim();

    // Find authenticated customer
    const customer = await Customer.findById(req.user);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    if (!customer.cart) {
      customer.cart = [];
    }

    const inCart = customer.cart.some(
      (item) => (item.product._id ? item.product._id.toString() : item.product.toString()).trim() === cleanProductId
    );

    if (!inCart) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart"
      });
    }

    customer.cart = customer.cart.filter(
      (item) => (item.product._id ? item.product._id.toString() : item.product.toString()).trim() !== cleanProductId
    );

    await customer.save();

    await customer.populate({
      path: "cart.product",
      select: "name price image stock category description"
    });

    const cart = (customer.cart || []).filter((item) => item && item.product);

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while removing product from cart"
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateQuantity,
  removeFromCart
};
