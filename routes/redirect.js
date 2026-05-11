const express = require("express");
const router = express.Router();

const Redirect = require("../models/redirect");
const { isLoggedIn, isAdmin } = require("../middleware/middleware");

// Get redirect rules with optional pagination and search
router.get("/", async (req, res) => {
  try {
    const { page, search } = req.query;

    // If no page param, return all redirects (backward compatible)
    if (!page) {
      const redirects = await Redirect.find({});
      return res.status(200).json(redirects);
    }

    const pageNum = parseInt(page) || 1;
    const limit = 10;
    const skip = (pageNum - 1) * limit;

    let query = {};
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      query = {
        $or: [{ from: searchRegex }, { to: searchRegex }],
      };
    }

    const [redirects, totalCount] = await Promise.all([
      Redirect.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Redirect.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      redirects,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: pageNum,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching redirects:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new redirect rule
router.post("/", isLoggedIn, isAdmin, async (req, res) => {
  const { from, to, type } = req.body;

  // Validate input
  if (!from || !to || !type) {
    return res
      .status(400)
      .json({ message: "From, To, and Type fields are required." });
  }

  try {
    // Check if a redirect already exists for the 'from' path
    const existingRedirect = await Redirect.findOne({ from });
    if (existingRedirect) {
      return res
        .status(400)
        .json({ message: "Redirect from this path already exists." });
    }

    const newRedirect = new Redirect({ from, to, type });
    await newRedirect.save();
    res.status(201).json(newRedirect);
  } catch (error) {
    console.error("Error creating redirect:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update an existing redirect rule
router.put("/:id", isLoggedIn, isAdmin, async (req, res) => {
  const { from, to, type } = req.body;
  const { id } = req.params;

  // Validate input
  if (!from || !to || !type) {
    return res
      .status(400)
      .json({ message: "From, To, and Type fields are required." });
  }

  try {
    const updatedRedirect = await Redirect.findByIdAndUpdate(
      id,
      { from, to, type },
      { new: true, runValidators: true }
    );

    if (!updatedRedirect) {
      return res.status(404).json({ message: "Redirect not found." });
    }

    res.status(200).json(updatedRedirect);
  } catch (error) {
    console.error("Error updating redirect:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a redirect rule
router.delete("/:id", isLoggedIn, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedRedirect = await Redirect.findByIdAndDelete(id);

    if (!deletedRedirect) {
      return res.status(404).json({ message: "Redirect not found." });
    }

    res.status(200).json({ message: "Redirect deleted successfully." });
  } catch (error) {
    console.error("Error deleting redirect:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
