const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const mongoose = require("mongoose");
const Content = require("../../models/content");

const DB_URL = process.env.DB_URL;
async function updateBlogContent() {
  try {
    // Connect to the database (replace with your DB connection string)
    await mongoose.connect(DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to database.");

    // Fetch all blogs
    const blogs = await Content.find();
    console.log(`Fetched ${blogs.length} blogs.`);

    // Loop through blogs and update content
    for (const blog of blogs) {
      if (blog.content) {
        // Remove meta tags and title using a regular expression
        const updatedContent = blog.content.replace(
          /<meta charset="UTF-8">|<meta name="viewport"[^>]*>|<title>[^<]*<\/title>/gi,
          ""
        );

        // Update the content only if it has been changed
        if (updatedContent !== blog.content) {
          blog.content = updatedContent;
          //   console.log("********************");
          //   console.log(blog.content);
          //   console.log("********************");
          await blog.save(); // Save the updated blog back to the database
          console.log(`Updated blog with ID: ${blog._id}`);
        }
      }
    }

    console.log("All blogs updated successfully.");
    mongoose.disconnect();
  } catch (error) {
    console.error("Error updating blogs:", error);
    mongoose.disconnect();
  }
}

// Run the function
// updateBlogContent();
