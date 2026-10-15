const express = require("express");

const {
  registerCustomer,
  loginCustomer,
  getProfile,
  logoutCustomer
} = require("../controllers/customer.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", registerCustomer);

router.post("/login", loginCustomer);

router.get("/me", authMiddleware, getProfile);

router.post("/logout", authMiddleware, logoutCustomer);

module.exports = router;