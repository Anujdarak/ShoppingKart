
require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("./models/product.model");

const API_URL =
  process.env.PRODUCTS_API_URL ||
  "https://dummyjson.com/products?limit=30";

async function seedProducts() {
  try {
    // Connect to your existing MongoDB Atlas database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Don't insert duplicate products if products already exist
    const count = await Product.countDocuments();

    if (count > 0) {
      console.log(`Database already contains ${count} products.`);
      return;
    }

    // Fetch sample products from DummyJSON
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Product API failed: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data.products) || data.products.length === 0) {
      throw new Error("The external API returned no products.");
    }

    // Convert DummyJSON fields to your Mongoose schema
    const products = data.products.map((item) => ({
      name: item.title,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.thumbnail || item.images?.[0],
      stock: item.stock ?? 0
    }));

    await Product.insertMany(products);

    console.log(`Successfully added ${products.length} products!`);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedProducts();
