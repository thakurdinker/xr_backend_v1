const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const mongoose = require("mongoose");
const Developer = require("../../models/developer");

const DB_URL = process.env.DB_URL;

const connectToDB = async () => {
  mongoose.connect(DB_URL);
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error: "));
  db.once("open", () => {
    console.log("Database connected");
  });
};

// Developer data to seed
const developers = [
  {
    logo_img_url:
      "https://d2i89gocgiy6bz.cloudfront.net/wp-content/uploads/2024/03/04135944/emaar-logo.jpeg",
    developer_name: "Emaar Properties",
    developer_slug: "emaar-properties",
    description:
      "Emaar Properties is one of the largest real estate developers in Dubai, known for iconic projects like the Burj Khalifa and Dubai Mall.",
    heading: "Leading Real Estate Developer in Dubai",
  },
  {
    logo_img_url:
      "https://d2i89gocgiy6bz.cloudfront.net/wp-content/uploads/2024/03/04135944/emaar-logo.jpeg",
    developer_name: "Damac Properties",
    developer_slug: "damac-properties",
    description:
      "Damac Properties is a premier luxury property developer, offering residential, commercial, and leisure properties across the Middle East.",
    heading: "Luxury Living and Investment Opportunities",
  },
  {
    logo_img_url:
      "https://d2i89gocgiy6bz.cloudfront.net/wp-content/uploads/2024/03/04135944/emaar-logo.jpeg",
    developer_name: "Nakheel",
    developer_slug: "nakheel",
    description:
      "Nakheel is known for iconic projects like Palm Jumeirah and The World Islands, creating a unique portfolio of world-class developments.",
    heading: "Creating Landmark Developments",
  },
  {
    logo_img_url:
      "https://d2i89gocgiy6bz.cloudfront.net/wp-content/uploads/2024/03/04135944/emaar-logo.jpeg",
    developer_name: "Meydan Group",
    developer_slug: "meydan-group",
    description:
      "Meydan Group is involved in a number of luxurious and lifestyle-oriented projects in Dubai, including the Meydan Racecourse and Meydan City.",
    heading: "Luxurious Lifestyle Developments",
  },
  {
    logo_img_url:
      "https://d2i89gocgiy6bz.cloudfront.net/wp-content/uploads/2024/03/04135944/emaar-logo.jpeg",
    developer_name: "Meraas",
    developer_slug: "meraas",
    description:
      "Meraas is known for creating innovative and world-class real estate projects, enhancing the lifestyle experience in Dubai.",
    heading: "Innovative Real Estate Solutions",
  },
];

// Seed the database
const seedDevelopers = async () => {
  try {
    await Developer.deleteMany({});
    await Developer.insertMany(developers);
    console.log("Database seeded with developer data");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding the database:", error);
    mongoose.connection.close();
  }
};

connectToDB().then(() =>
  seedDevelopers().then(() => mongoose.connection.close())
);
