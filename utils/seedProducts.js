const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("../models/product.model");

dotenv.config();

const sampleProducts = [
  {
    name: "Noise Cancelling Headphones",
    description: "Wireless over-ear headphones with active noise cancellation, 40-hour battery life, and crystal clear soundstage.",
    price: 4999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    stock: 25
  },
  {
    name: "Mechanical Keyboard",
    description: "RGB mechanical gaming keyboard with tactile blue switches, durable aluminum frame, and customizable backlighting.",
    price: 2999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
    stock: 12
  },
  {
    name: "Wireless Gaming Mouse",
    description: "Ultra-lightweight ergonomic optical gaming mouse with 26,000 DPI sensor and lag-free wireless connection.",
    price: 1899,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80",
    stock: 18
  },
  {
    name: "Classic Denim Jacket",
    description: "Timeless vintage wash denim jacket made from 100% sustainable organic cotton with reinforced stitching.",
    price: 2499,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80",
    stock: 15
  },
  {
    name: "Cotton Casual Sneakers",
    description: "Everyday minimalist low-top breathable sneakers with memory foam insoles for ultimate day-long comfort.",
    price: 1999,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80",
    stock: 30
  },
  {
    name: "Atomic Habits by James Clear",
    description: "An easy and proven way to build good habits and break bad ones. International bestseller on personal growth.",
    price: 499,
    category: "Books",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80",
    stock: 45
  },
  {
    name: "Clean Code by Robert C. Martin",
    description: "A handbook of agile software craftsmanship. Master the principles, patterns, and practices of writing clean code.",
    price: 899,
    category: "Books",
    image: "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=800&auto=format&fit=crop&q=80",
    stock: 20
  },
  {
    name: "Ceramic Minimalist Coffee Mug Set",
    description: "Handcrafted matte ceramic mugs (set of 2) with ergonomic handles, dishwasher and microwave safe.",
    price: 799,
    category: "Home",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
    stock: 40
  },
  {
    name: "Smart LED Desk Lamp",
    description: "Dimmable eye-care architect LED desk lamp with touch controls, 5 color modes, and integrated wireless charging base.",
    price: 1599,
    category: "Home",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
    stock: 8
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // Count existing products
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log("No products found in database. Seeding sample catalog...");
      await Product.insertMany(sampleProducts);
      console.log(`Seeded ${sampleProducts.length} products successfully!`);
    } else {
      console.log(`Database already has ${count} products.`);
    }

    await mongoose.connection.close();
    console.log("Seeding finished.");
  } catch (error) {
    console.error("Error seeding products:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed, sampleProducts };
