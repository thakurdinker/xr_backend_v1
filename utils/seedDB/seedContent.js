const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const mongoose = require("mongoose");
const Content = require("../../models/content");

const DB_URL = process.env.DB_URL;

// Array of sample content data
const contents = [
  {
    title: "Sample Title 1",
    slug: "sample-title-1",
    content: "<p>This is a sample content 1</p>",
    featured_image: "https://picsum.photos/1920/1080",
    author: { name: "Author 1", email: "author1@example.com" },
    category: "blog",
    tags: ["sample", "content"],
    publish_date: new Date(),
    status: "published",
    images: [
      { url: "https://picsum.photos/1920/1080", description: "Image 1" },
    ],
    faqs: [{ question: "FAQ 1?", answer: "Answer 1" }],
    meta_title: "Sample Meta Title 1",
    meta_description: "Sample Meta Description 1",
    keywords: ["keyword1", "keyword2"],
    schema_org: { type: "Article", properties: { author: "Author 1" } },
    open_graph: {
      title: "Open Graph Title 1",
      description: "Open Graph Description 1",
      image: "https://example.com/image1.jpg",
      type: "article",
    },
  },
  // Add 19 more sample documents here...
];

// Repeat the above object 19 times with different values
for (let i = 2; i <= 20; i++) {
  contents.push({
    title: `Sample Title ${i}`,
    slug: `sample-title-${i}`,
    content: `<p>This is a sample content ${i}</p>`,
    featured_image: `https://picsum.photos/1920/1080`,
    author: { name: `Author ${i}`, email: `author${i}@example.com` },
    category: i % 3 === 0 ? "news" : i % 3 === 1 ? "article" : "blog",
    tags: ["sample", "content"],
    publish_date: new Date(),
    status: i % 2 === 0 ? "draft" : "published",
    images: [
      { url: `https://picsum.photos/1920/1080`, description: `Image ${i}` },
    ],
    faqs: [{ question: `FAQ ${i}?`, answer: `Answer ${i}` }],
    meta_title: `Sample Meta Title ${i}`,
    meta_description: `Sample Meta Description ${i}`,
    keywords: ["keyword1", "keyword2"],
    schema_org: { type: "Article", properties: { author: `Author ${i}` } },
    open_graph: {
      title: `Open Graph Title ${i}`,
      description: `Open Graph Description ${i}`,
      image: `https://example.com/image${i}.jpg`,
      type: "article",
    },
  });
}

const connectToDB = async () => {
  mongoose.connect(DB_URL);
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error: "));
  db.once("open", () => {
    console.log("Database connected");
  });
};

const seedContent = async () => {
  try {
    await Content.deleteMany({});
    console.log("Content deleted Successfully");
    await Content.insertMany(contents);
    console.log("Content seeded successfully");
  } catch (error) {
    console.error("Error seeding the database", error);
  }
};

connectToDB().then(() => seedContent().then(() => mongoose.connection.close()));
