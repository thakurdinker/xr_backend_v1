const express = require("express");
const cloudinary = require("../cloudinary/cloudinaryConfig");
const { isLoggedIn } = require("../middleware/middleware");

const router = express.Router({ mergeParams: true });

function extractPublicIdfromUrl(url) {
  // Extract the desired part by splitting the pathname
  const parts = url.split("/");

  // Return the last two parts joined by a slash
  try {
    return parts.slice(-2).join("/").split(".")[0];
  } catch (err) {
    console.log(err);
    return null;
  }
}

router.route("/deleteAsset").post(isLoggedIn, async (req, res) => {
  const public_id = extractPublicIdfromUrl(req.body.assetUrl);

  if (public_id === null) {
    return res
      .status(200)
      .json({ success: false, isDeleted: false, message: "No a valid url" });
  }

  try {
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: "image",
      invalidate: true,
    });
    // console.log(result);
    return res
      .status(200)
      .json({ success: true, isDeleted: true, message: result });
  } catch (err) {
    return res
      .status(200)
      .json({ success: false, isDeleted: false, message: err.message });
    0;
  }
});

module.exports = router;
