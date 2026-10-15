const mongoose = require("mongoose");
const Product = require("../models/product.model");

// CREATE PRODUCT - POST /products
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    // Validate required fields
    if (
      !name ||
      !description ||
      price === undefined ||
      price === null ||
      !category ||
      !image ||
      stock === undefined ||
      stock === null
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields (name, description, price, category, image, stock) are required"
      });
    }

    // Validate price > 0
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid number greater than 0"
      });
    }

    // Validate stock >= 0
    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock must be a valid number greater than or equal to 0"
      });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: numPrice,
      category: category.trim(),
      image: image.trim(),
      stock: numStock
    });

    return res.status(201).json(product);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error while creating product"
    });
  }
};

// GET ALL PRODUCTS - GET /products (with search, category, and sort)
const getAllProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    const query = {};

    // Task 5: Search products by name (case-insensitive)
    if (search && search.trim() !== "") {
      const sanitizedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.name = { $regex: sanitizedSearch, $options: "i" };
    }

    // Task 5: Category filter
    if (category && category.trim() !== "" && category.toLowerCase() !== "all" && category.toLowerCase() !== "all categories") {
      const sanitizedCat = category.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.category = { $regex: new RegExp(`^${sanitizedCat}$`, "i") };
    }

    // Bonus Challenge (+10 Marks): Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === "price_asc") {
      sortOptions = { price: 1 };
    } else if (sort === "price_desc") {
      sortOptions = { price: -1 };
    }

    const products = await Product.find(query).sort(sortOptions);

    return res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching products"
    });
  }
};

// GET SINGLE PRODUCT - GET /products/:id
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Task 4: Validate product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format"
      });
    }

    const product = await Product.findById(id);

    // Task 4: Product not found
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching product"
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById
};
