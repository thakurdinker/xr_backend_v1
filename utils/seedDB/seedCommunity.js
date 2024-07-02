const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const mongoose = require("mongoose");
const Community = require("../../models/community");

const DB_URL = process.env.DB_URL;

const dummyCommunities = [
  {
    name: "Greenwood Heights",
    slug: "greenwood-heights",
    description:
      "Greenwood Heights is a serene community with lush green parks and modern amenities.",
    location: {
      address: "123 Elm Street",
      city: "Greenwood",
      state: "CA",
      country: "USA",
      coordinates: {
        lat: 37.7749,
        lng: -122.4194,
      },
    },
    amenities: [
      {
        name: "Swimming Pool",
        icon_url: "http://example.com/icons/pool.png",
        description: "Olympic-sized swimming pool.",
      },
      {
        name: "Gym",
        icon_url: "http://example.com/icons/gym.png",
        description: "State-of-the-art fitness center.",
      },
      {
        name: "Park",
        icon_url: "http://example.com/icons/park.png",
        description: "Beautifully landscaped park.",
      },
    ],
    images: [
      {
        url: "http://example.com/images/community1.jpg",
        description: "Community overview.",
      },
      {
        url: "http://example.com/images/community2.jpg",
        description: "Park area.",
      },
    ],
    faqs: [
      {
        question: "What are the community fees?",
        answer: "Community fees are $150 per month.",
      },
      {
        question: "Are pets allowed?",
        answer: "Yes, pets are allowed in the community.",
      },
    ],
    seo: {
      meta_title: "Greenwood Heights - Serene Community with Modern Amenities",
      meta_description:
        "Discover Greenwood Heights, a serene community offering lush parks and modern amenities.",
      keywords: ["Greenwood Heights", "community", "modern amenities"],
    },
    schema_org: { type: "Place", properties: {} },
    open_graph: {
      title: "Greenwood Heights",
      description: "Serene community with modern amenities.",
      image: "http://example.com/images/community1.jpg",
    },
  },
  {
    name: "Lakeside Villas",
    slug: "lakeside-villas",
    description:
      "Lakeside Villas offers luxurious living with stunning lake views and top-notch facilities.",
    location: {
      address: "456 Lakeview Drive",
      city: "Lakeside",
      state: "NY",
      country: "USA",
      coordinates: {
        lat: 40.7128,
        lng: -74.006,
      },
    },
    amenities: [
      {
        name: "Boat Dock",
        icon_url: "http://example.com/icons/boat.png",
        description: "Private boat dock.",
      },
      {
        name: "Tennis Courts",
        icon_url: "http://example.com/icons/tennis.png",
        description: "Professional-grade tennis courts.",
      },
      {
        name: "Clubhouse",
        icon_url: "http://example.com/icons/clubhouse.png",
        description: "Exclusive community clubhouse.",
      },
    ],
    images: [
      {
        url: "http://example.com/images/community3.jpg",
        description: "Lake view.",
      },
      {
        url: "http://example.com/images/community4.jpg",
        description: "Tennis courts.",
      },
    ],
    faqs: [
      {
        question: "Is there a clubhouse?",
        answer: "Yes, there is an exclusive clubhouse for residents.",
      },
      {
        question: "What are the lake access rules?",
        answer: "Residents have private access to the lake.",
      },
    ],
    seo: {
      meta_title: "Lakeside Villas - Luxurious Living with Stunning Lake Views",
      meta_description:
        "Experience luxurious living at Lakeside Villas with stunning lake views and top-notch facilities.",
      keywords: ["Lakeside Villas", "luxury living", "lake views"],
    },
    schema_org: { type: "Place", properties: {} },
    open_graph: {
      title: "Lakeside Villas",
      description: "Luxurious living with stunning lake views.",
      image: "http://example.com/images/community3.jpg",
    },
  },
  // Add 3 more communities similarly
];

const connectToDB = async () => {
  mongoose.connect(DB_URL);
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error: "));
  db.once("open", () => {
    console.log("Database connected");
  });
};

const seedCommunity = async () => {
  try {
    await Community.deleteMany({});
    await Community.insertMany(dummyCommunities);
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding the database", error);
  }
};

connectToDB().then(() =>
  seedCommunity().then(() => mongoose.connection.close())
);
