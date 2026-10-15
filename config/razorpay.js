const Razorpay = require("razorpay");

let razorpayInstance = null;

try {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_shopkartLab06Key",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "shopkartLab06Secret12345678"
  });
} catch (err) {
  console.warn("Razorpay initialization warning:", err.message);
}

module.exports = razorpayInstance;
