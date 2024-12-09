const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { uploadResume } = require("../controller/resumeUploadController");
const { isLoggedIn } = require("../middleware/middleware");
const { cloudinary_js_config } = require("../cloudinary/cloudinaryConfig");

const router = express.Router({ mergeParams: true });

const storage = new CloudinaryStorage({
  cloudinary: cloudinary_js_config,
  params: {
    folder: "resumes_website",
    format: async (req, file) => "pdf", // supports promises as well
    public_id: (req, file) => Date.now() + "-" + uuidv4(),
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only .pdf files are allowed!"), false);
    }
    cb(null, true);
  },
});

router.post("/upload", upload.single("resume"), uploadResume);

module.exports = router;
