const express = require("express");
const router = express.Router();

const Redirect = require("../models/redirect");
const { isLoggedIn, isAdmin } = require("../middleware/middleware");

// ── Frontend cache revalidation ─────────────────────────────────────────────
// The Next.js frontend serves these MongoDB redirects through a runtime proxy
// that caches the rule map (CMS data-cache ~5 min + per-instance proxy cache
// ~2 min). Without a nudge, a new/edited redirect takes minutes to go live.
//
// Worse, when a redirect accompanies an article MOVE (e.g. our-publications →
// blog), the frontend's per-article data cache still holds the OLD category for
// ~5 min, so the article page keeps canonical-redirecting the new URL back to
// the old one while this rule redirects old → new — a redirect LOOP until the
// caches expire.
//
// Firing the frontend's /api/revalidate on every redirect mutation busts both:
//   - tag "redirects"      → the redirect map updates immediately
//   - tag "article:<slug>" → the moved article's canonical updates immediately,
//                            so it can't redirect back (kills the loop)
//
// Fire-and-forget: a revalidation failure must NEVER break the redirect CRUD
// (the frontend still falls back to its cache TTLs). Requires REVALIDATE_SECRET
// (same value the frontend checks) — when unset, this safely no-ops.
const MAIN_FRONTEND_URL =
  process.env.MAIN_FRONTEND_URL || "https://www.xrealty.ae";
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || "";

// Best-effort article slug = last non-empty path segment of a site-relative URL.
function slugFromPath(path) {
  if (typeof path !== "string") return "";
  const clean = path.split("?")[0].split("#")[0].replace(/\/+$/, "");
  return clean.split("/").filter(Boolean).pop() || "";
}

function revalidateFrontend(affectedTo) {
  if (!REVALIDATE_SECRET) return; // not configured → rely on frontend cache TTLs
  const tags = ["redirects"];
  const slug = slugFromPath(affectedTo);
  if (slug) tags.push(`article:${slug}`);
  fetch(`${MAIN_FRONTEND_URL}/api/revalidate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: REVALIDATE_SECRET, tags }),
    signal: AbortSignal.timeout(5000),
  }).catch((err) => {
    console.error("[redirect] frontend revalidate failed:", err.message);
  });
}

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
    revalidateFrontend(to);
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

    revalidateFrontend(to);
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

    revalidateFrontend(deletedRedirect.to);
    res.status(200).json({ message: "Redirect deleted successfully." });
  } catch (error) {
    console.error("Error deleting redirect:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
