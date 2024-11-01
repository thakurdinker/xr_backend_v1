const express = require("express");
const catchAsync = require("../utils/seedDB/catchAsync");

const fs = require("fs");
const path = require("path");
const { isLoggedIn } = require("../middleware/middleware");
const Property = require("../models/properties");

const router = express.Router({ mergeParams: true });

router.route("/propertyType").get(
  catchAsync(async (req, res) => {
    let data = null;

    try {
      const filePath = path.join(__dirname, "../configs/property-types.json");
      data = fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
    } catch (e) {
      console.log(e.message);
    }

    return res.status(200).json({
      success: true,
      propertyTypes: JSON.parse(data),
      message: "DONE",
    });
  })
);

// router.route("/propertytype/:type").get(
//   catchAsync(async (req, res) => {
//     const { type } = req.params;

//     try {
//       const filePath = path.join(__dirname, "../configs/property-types.json");
//       data = fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
//     } catch (e) {
//       console.log(e.message);
//     }

//     console.log(JSON.parse(data));

//     const properties = await Property.find({ "type.name": type });

//     res.send(properties);
//   })
// );

module.exports = router;
