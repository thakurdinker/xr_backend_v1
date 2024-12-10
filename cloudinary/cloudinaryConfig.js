const dotenv = require("dotenv");
const path = require("path");

const cloudinary = require("cloudinary").v2;

dotenv.config({ path: path.resolve(__dirname, "../vars/.env") });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = { cloudinary_js_config: cloudinary };
