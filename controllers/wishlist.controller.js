const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// ADD PRODUCT TO WISHLIST - POST /wishlist/:productId
const addToWishlist = async (req, res) => {
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

    if (!customer.wishlist) {
      customer.wishlist = [];
    }

    // Check if product is already wishlisted
    const isAlreadyWishlisted = customer.wishlist.some(
      (id) => (id._id ? id._id.toString() : id.toString()).trim() === cleanProductId
    );

    if (isAlreadyWishlisted) {
      return res.status(409).json({
        success: false,
        message: "Product already in wishlist"
      });
    }

    // Add Product reference and save with strict deduplication
    const existingIds = customer.wishlist.map(id => (id._id ? id._id.toString() : id.toString()).trim());
    if (!existingIds.includes(cleanProductId)) {
      customer.wishlist.push(cleanProductId);
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while adding to wishlist"
    });
  }
};

// GET CURRENT USER'S WISHLIST - GET /wishlist
const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user).populate({
      path: "wishlist",
      select: "name description price category image stock"
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    // Filter out any dangling references if a product was deleted, AND deduplicate
    const seen = new Set();
    const wishlist = [];
    for (const item of (customer.wishlist || [])) {
      if (item && item._id) {
        const idStr = item._id.toString();
        if (!seen.has(idStr)) {
          seen.add(idStr);
          wishlist.push(item);
        }
      }
    }

    return res.status(200).json({
      success: true,
      count: wishlist.length,
      wishlist
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching wishlist"
    });
  }
};

// REMOVE PRODUCT FROM WISHLIST - DELETE /wishlist/:productId
const removeFromWishlist = async (req, res) => {
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

    // Check if product is currently in wishlist
    const inWishlist = customer.wishlist && customer.wishlist.some(
      (id) => (id._id ? id._id.toString() : id.toString()).trim() === cleanProductId
    );

    if (!inWishlist) {
      return res.status(404).json({
        success: false,
        message: "Product not in wishlist"
      });
    }

    // Remove product reference and save
    customer.wishlist = (customer.wishlist || []).filter(
      (id) => (id._id ? id._id.toString() : id.toString()).trim() !== cleanProductId
    );
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while removing from wishlist"
    });
  }
};

// BONUS: TOGGLE WISHLIST - PATCH /wishlist/:productId/toggle
const toggleWishlist = async (req, res) => {
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

    // Find product
    const product = await Product.findById(cleanProductId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
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

    if (!customer.wishlist) {
      customer.wishlist = [];
    }

    const inWishlist = customer.wishlist.some(
      (id) => (id._id ? id._id.toString() : id.toString()).trim() === cleanProductId
    );

    if (inWishlist) {
      customer.wishlist = customer.wishlist.filter(
        (id) => (id._id ? id._id.toString() : id.toString()).trim() !== cleanProductId
      );
      await customer.save();
      return res.status(200).json({
        success: true,
        saved: false,
        message: "Product removed from wishlist"
      });
    } else {
      const existingIds = customer.wishlist.map(id => (id._id ? id._id.toString() : id.toString()).trim());
      if (!existingIds.includes(cleanProductId)) {
        customer.wishlist.push(cleanProductId);
        await customer.save();
      }
      return res.status(200).json({
        success: true,
        saved: true,
        message: "Product added to wishlist"
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while toggling wishlist"
    });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist
};
