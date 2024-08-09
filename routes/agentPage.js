const express = require("express");
const catchAsync = require("../utils/seedDB/catchAsync");
const Agent = require("../models/agent");

const fs = require("fs");
const path = require("path");
const shuffle = require("../utils/shuffleArray");

const router = express.Router({ mergeParams: true });

router.route("/").get(
  catchAsync(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const agents = shuffle(await Agent.find({}))
      .limit(limit)
      .skip((page - 1) * limit)
      .select("_id name name_slug phone languages profile_picture");

    let data = null;

    try {
      const filePath = path.join(__dirname, `../seo/meet-the-xr.json`);
      data = JSON.parse(
        fs.readFileSync(filePath, { encoding: "utf8", flag: "r" })
      );
    } catch (e) {
      console.log(e.message);
    }

    const count = await Agent.countDocuments();

    return res.status(200).json({
      success: true,
      topSection: data.top_section,
      bottomSection: data.bottom_section,
      agents,
      message: "DONE",
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  })
);

module.exports = router;
