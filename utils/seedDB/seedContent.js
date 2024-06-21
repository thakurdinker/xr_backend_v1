const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const mongoose = require("mongoose");
const Content = require("../../models/content");

const DB_URL = process.env.DB_URL;

const dummyContents = [
  {
    title: "Understanding JavaScript",
    slug: "understanding-javascript",
    content: "<p>This is an article about JavaScript.</p>",
    author: { name: "John Doe", email: "john@example.com" },
    category: "blog",
    tags: ["JavaScript", "Programming"],
    publish_date: new Date(),
    status: "published",
    images: [
      { url: "http://example.com/js.jpg", description: "JavaScript logo" },
    ],
    faqs: [
      {
        question: "What is JavaScript?",
        answer: "JavaScript is a programming language.",
      },
      {
        question: "Why use JavaScript?",
        answer: "It is versatile and widely used.",
      },
    ],
    meta_title: "Understanding JavaScript",
    meta_description: "An in-depth article about JavaScript.",
    keywords: ["JavaScript", "Programming"],
    schema_org: { type: "Article", properties: {} },
    open_graph: {
      title: "Understanding JavaScript",
      description: "An in-depth article about JavaScript.",
      image: "http://example.com/js.jpg",
    },
  },
  {
    title: "Getting Started with Python",
    slug: "getting-started-with-python",
    content: "<p>This is an article about Python.</p>",
    author: { name: "Jane Smith", email: "jane@example.com" },
    category: "blog",
    tags: ["Python", "Programming"],
    publish_date: new Date(),
    status: "published",
    images: [
      { url: "http://example.com/python.jpg", description: "Python logo" },
    ],
    faqs: [
      {
        question: "What is Python?",
        answer: "Python is a programming language.",
      },
      {
        question: "Why use Python?",
        answer: "It is easy to learn and powerful.",
      },
    ],
    meta_title: "Getting Started with Python",
    meta_description: "An in-depth article about Python.",
    keywords: ["Python", "Programming"],
    schema_org: { type: "Article", properties: {} },
    open_graph: {
      title: "Getting Started with Python",
      description: "An in-depth article about Python.",
      image: "http://example.com/python.jpg",
    },
  },
  // Add 8 more contents similarly
  {
    title: "Exploring Node.js",
    slug: "exploring-nodejs",
    content: "<p>This is an article about Node.js.</p>",
    author: { name: "Alice Johnson", email: "alice@example.com" },
    category: "news",
    tags: ["Node.js", "JavaScript"],
    publish_date: new Date(),
    status: "published",
    images: [
      { url: "http://example.com/nodejs.jpg", description: "Node.js logo" },
    ],
    faqs: [
      {
        question: "What is Node.js?",
        answer: "Node.js is a JavaScript runtime.",
      },
      {
        question: "Why use Node.js?",
        answer: "It allows JavaScript to run on the server.",
      },
    ],
    meta_title: "Exploring Node.js",
    meta_description: "An in-depth article about Node.js.",
    keywords: ["Node.js", "JavaScript"],
    schema_org: { type: "Article", properties: {} },
    open_graph: {
      title: "Exploring Node.js",
      description: "An in-depth article about Node.js.",
      image: "http://example.com/nodejs.jpg",
    },
  },
  // Add 7 more contents similarly
];

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
    await Content.insertMany(dummyContents);
    console.log("Content seeded successfully");
  } catch (error) {
    console.error("Error seeding the database", error);
  }
};

connectToDB().then(() => seedContent().then(() => mongoose.connection.close()));
