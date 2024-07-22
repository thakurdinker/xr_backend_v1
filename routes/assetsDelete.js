const express = require("express");
const cloudinary = require("../cloudinary/cloudinaryConfig");
const { isLoggedIn } = require("../middleware/middleware");

const router = express.Router({ mergeParams: true });

function extractPublicIdfromUrl(url) {
  // Extract the desired part by splitting the pathname
  const parts = url.split("/");

  // Return the last two parts joined by a slash
  return parts.slice(-2).join("/").split(".")[0];
}

router.route("/deleteAsset").post(isLoggedIn, async (req, res) => {
  const { assetUrl } = req.body;

  const public_id = extractPublicIdfromUrl(assetUrl);

  //   return res.send(public_id);

  try {
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: "image",
      invalidate: true,
    });
    console.log(result);
    return res
      .status(200)
      .json({ success: true, isDeleted: true, message: "DONE" });
  } catch (err) {
    return res
      .status(200)
      .json({ success: false, isDeleted: false, message: err });
  }
});

module.exports = router;
