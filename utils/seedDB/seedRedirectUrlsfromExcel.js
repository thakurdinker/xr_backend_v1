const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });
const xlsx = require("xlsx");
const Redirect = require("../../models/redirect");

// Replace with your MongoDB connection string
const MONGODB_URI = process.env.DB_URL;

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Load the Excel file
const workbook = xlsx.readFile(
  path.resolve(__dirname, "../seedDB/Canonical Tags-2.xlsx")
); // Replace with your file path
const sheetName = workbook.SheetNames[0]; // Get the first sheet
const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]); // Convert sheet to JSON array

// Function to remove 'https://www.xrealty.ae' from a string
const cleanURL = (url) => url.replace("https://www.xrealty.ae", "").trim();

// Seed function
const seedRedirects = async () => {
  try {
    // Map over sheetData to create redirect objects
    const redirects = sheetData.map((row) => ({
      from: cleanURL(row.from),
      to: cleanURL(row.to),
      type: "301",
    }));

    // Insert data into MongoDB
    await Redirect.insertMany(redirects);
    console.log("Redirects seeded successfully!");

    // Close the MongoDB connection
    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding redirects:", error);
    mongoose.connection.close();
  }
};

seedRedirects();
