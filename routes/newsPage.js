// const express = require("express");
// const catchAsync = require("../utils/seedDB/catchAsync");
// const Content = require("../models/content");

// const fs = require("fs");
// const path = require("path");

// const router = express.Router({ mergeParams: true });

// // All News and articles
// router.route("/real-estate-news").get(
//   catchAsync(async (req, res) => {
//     const { page = 1, limit = 20, category } = req.query;
//     // let query = {
//     //   status: "published",
//     // };

//     // if (category && category.trim() !== "") {
//     //   query.category = category.trim().toLowerCase();
//     // }

//     let query = {
//       status: "published",
//     };

//     if (category && category.trim() !== "") {
//       query.category = { $regex: new RegExp(category.trim(), "i") };
//     }
//     try {
//       const filePath = path.join(
//         __dirname,
//         "../configs/content-categories.json"
//       );
//       data = fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
//     } catch (e) {
//       console.log(e.message);
//     }
//     // const categories = await Content.distinct("category");
//     const newsAndBlogs = await Content.find(query).sort("-createdAt").limit(20);
//     const count = await Content.countDocuments(query);
//     return res.status(200).json({
//       success: true,
//       categories: JSON.parse(data),
//       newsAndBlogs,
//       totalPages: Math.ceil(count / limit),
//       currentPage: page,
//       message: "DONE",
//     });
//   })
// );

// // get content matching content slug
// router.route("/:contentSlug").get(
//   catchAsync(async (req, res) => {
//     const { contentSlug } = req.params;
//     const content = await Content.find({
//       slug: contentSlug,
//       status: "published",
//     });

//     return res.status(200).json({ success: true, content, message: "DONE" });
//   })
// );

// module.exports = router;

// const express = require("express");
// const catchAsync = require("../utils/seedDB/catchAsync");
// const Content = require("../models/content");
// const fs = require("fs");
// const path = require("path");

// const router = express.Router({ mergeParams: true });

// // Read all news and articles with pagination - For Public Route
// module.exports.getAllNewsAndArticles = catchAsync(async (req, res) => {
//   const { page = 1, limit = 8, category, sortOrder = -1 } = req.query;
//   // Build query object
//   let query = { status: "published" };

//   // If category is provided, add it to the query with case-insensitive regex
//   if (category && category.trim() !== "") {
//     query.category = { $regex: new RegExp(category.trim(), "i") };
//   }

//   try {
//     // Fetch the news and blogs with pagination
//     const newsAndBlogs = await Content.find(query)
//       .sort({ publish_date: sortOrder })
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .select("_id title slug publish_date category featured_image") // Select only the necessary fields
//       .exec();

//     // Get the total count of documents matching the query
//     const count = await Content.countDocuments(query);

//     // Fetch categories from the JSON file
//     const filePath = path.join(__dirname, "../configs/content-categories.json");
//     let categories = [];
//     try {
//       const data = fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
//       categories = JSON.parse(data);
//     } catch (e) {
//       console.log("Error reading categories file:", e.message);
//     }

//     return res.status(200).json({
//       success: true,
//       newsAndBlogs,
//       categories,
//       message: "DONE",
//       totalPages: Math.ceil(count / limit),
//       currentPage: Number(page),
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// });

// // Read a single news article by slug
// module.exports.getBySlug = catchAsync(async (req, res) => {
//   const { contentSlug } = req.params;

//   try {
//     const content = await Content.findOne({ slug: contentSlug, status: "published" });

//     if (!content) {
//       return res.status(200).json({ success: false, message: "No article found" });
//     }

//     return res.status(200).json({ success: true, content, message: "DONE" });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// });

// // Route definitions
// router.get("/real-estate-news", module.exports.getAllNewsAndArticles);
// router.get("/:contentSlug", module.exports.getBySlug);

// module.exports = router;

const express = require("express");
const catchAsync = require("../utils/seedDB/catchAsync");
const Content = require("../models/content");
const fs = require("fs");
const path = require("path");
const Redirect = require("../models/redirect");

const router = express.Router({ mergeParams: true });

// All News and articles
router.route("/real-estate-news").get(
  catchAsync(async (req, res) => {
    const { page = 1, limit = 20, category, sortOrder = -1 } = req.query;

    // Build query object
    let query = { status: "published", category: "News" };

    // If category is provided, add it to the query with case-insensitive regex
    if (category && category.trim() !== "") {
      query.category = { $regex: new RegExp(category.trim(), "i") };
    }

    try {
      // Fetch categories from the JSON file
      const filePath = path.join(
        __dirname,
        "../configs/content-categories.json"
      );
      let categories = [];
      try {
        const data = fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
        categories = JSON.parse(data);
      } catch (e) {
        console.log("Error reading categories file:", e.message);
      }

      // Fetch the news and blogs with pagination
      // const newsAndBlogs = await Content.find(query)
      //   .sort({ publish_date: sortOrder }) // Sort by publish_date
      //   .limit(limit * 1)
      //   .skip((page - 1) * limit)
      //   .select("_id title slug publish_date category featured_image") // Select only the necessary fields
      //   .exec();

      const newsAndBlogs = await Content.find(query)
        .sort({ publish_date: sortOrder }) // Sort by publish_date

        .select("_id title slug publish_date category featured_image") // Select only the necessary fields
        .exec();

      for (let i = 0; i < newsAndBlogs.length; i++) {
        const blog = newsAndBlogs[i];
        const redirect = await Redirect.findOne({
          from: "/" + blog.slug,
        });

        if (redirect) {
          blog.slug = redirect.to;
        }
      }

      // Get the total count of documents matching the query
      // const count = await Content.countDocuments(query);

      return res.status(200).json({
        success: true,
        categories,
        newsAndBlogs,
        // totalPages: Math.ceil(count / limit),
        // currentPage: Number(page),
        message: "DONE",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  })
);

// Blogs
router.route("/blogs").get(
  catchAsync(async (req, res) => {
    const { page = 1, limit = 20, category, sortOrder = -1 } = req.query;

    // Build query object
    let query = { status: "published", category: "Blog" };

    // If category is provided, add it to the query with case-insensitive regex
    if (category && category.trim() !== "") {
      query.category = { $regex: new RegExp(category.trim(), "i") };
    }

    try {
      // Fetch categories from the JSON file
      const filePath = path.join(
        __dirname,
        "../configs/content-categories.json"
      );
      let categories = [];
      try {
        const data = fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
        categories = JSON.parse(data);
      } catch (e) {
        console.log("Error reading categories file:", e.message);
      }

      // Fetch blogs with pagination
      // const blogs = await Content.find(query)
      //   .sort({ publish_date: sortOrder }) // Sort by publish_date
      //   .limit(limit * 1)
      //   .skip((page - 1) * limit)
      //   .select("_id title slug publish_date category featured_image") // Select only the necessary fields
      //   .exec();

      const blogs = await Content.find(query)
        .sort({ publish_date: sortOrder }) // Sort by publish_date
        .select("_id title slug publish_date category featured_image") // Select only the necessary fields
        .exec();

      for (let i = 0; i < blogs.length; i++) {
        const blog = blogs[i];
        const redirect = await Redirect.findOne({
          from: "/" + blog.slug,
        });

        if (redirect) {
          blog.slug = redirect.to;
        }
      }

      // Get the total count of documents matching the query
      // const count = await Content.countDocuments(query);

      return res.status(200).json({
        success: true,
        categories,
        blogs,
        message: "DONE",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  })
);

// Read a single news article by slug
// router.route("/:contentSlug").get(
//   catchAsync(async (req, res) => {
//     const { contentSlug } = req.params;
//     const content = await Content.find({
//       slug: contentSlug,
//       status: "published",
//     });

//     return res.status(200).json({ success: true, content, message: "DONE" });
//   })
// );

// Read a single news article by slug
router.route("/:contentSlug").get(
  catchAsync(async (req, res) => {
    const { contentSlug } = req.params;
    // console.log(contentSlug);
    let content = [];
    content = await Content.find({
      slug: contentSlug,
      status: "published",
    });

    if (content.length === 0) {
      // This is an extra check for fetching slug from redirect url, if found, for any content slug
      // Search for the slug in the redirect url,
      const redirects = await Redirect.find({
        to: { $regex: contentSlug, $options: "i" }, // 'i' makes it case-insensitive
      });

      // console.log(redirects);

      if (redirects.length > 0) {
        // Handle the matching redirects
        // console.log("Redirects found: ", redirects);
        content = await Content.find({
          slug: redirects[0].from.split("/")[1],
          status: "published",
        });

        if (content) {
          return res
            .status(200)
            .json({ success: true, content, message: "DONE" });
        }

        return res
          .status(200)
          .json({ success: true, content, message: "DONE" });
      }
    }

    return res.status(200).json({ success: true, content, message: "DONE" });
  })
);

module.exports = router;
