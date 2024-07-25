const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const mongoose = require("mongoose");
const Community = require("../../models/community");

const DB_URL = process.env.DB_URL;

// Array of sample community data
const communities = [
  {
    name: "Sample Community 1",
    slug: "sample-community-1",
    description: "This is a detailed description for Sample Community 1.",
    location: {
      address: "123 Sample Street",
      city: "Sample City",
      state: "Sample State",
      country: "Sample Country",
      coordinates: {
        lat: 25.276987,
        lng: 55.296249,
      },
    },
    amenities: [
      {
        name: "Park",
        icon_url: "https://example.com/icons/park.png",
        description: "A beautiful park for residents.",
      },
    ],
    images: [
      {
        url: "https://example.com/images/community1.jpg",
        description: "Community Image 1",
      },
    ],
    faqs: [
      {
        question: "What are the community amenities?",
        answer: "Park, Pool, Gym",
      },
    ],
    seo: {
      meta_title: "Sample Community 1",
      meta_description: "Detailed SEO description for Sample Community 1.",
      keywords: ["community", "sample", "example"],
    },
    schema_org: {
      type: "Place",
      properties: { name: "Sample Community 1" },
    },
    open_graph: {
      title: "Sample Community 1",
      description: "Open Graph description for Sample Community 1.",
      image: "https://example.com/images/community1-og.jpg",
    },
  },
  // Add 19 more sample documents here...
];

// Repeat the above object 19 times with different values
for (let i = 2; i <= 20; i++) {
  communities.push({
    name: `Sample Community ${i}`,
    slug: `sample-community-${i}`,
    description: `This is a detailed description for Sample Community ${i}.`,
    location: {
      address: `123 Sample Street ${i}`,
      city: "Sample City",
      state: "Sample State",
      country: "Sample Country",
      coordinates: {
        lat: 25.276987 + i * 0.01,
        lng: 55.296249 + i * 0.01,
      },
    },
    amenities: [
      {
        name: `Amenity ${i}`,
        icon_url: `https://example.com/icons/amenity${i}.png`,
        description: `Description for Amenity ${i}.`,
      },
    ],
    images: [
      {
        url: `https://example.com/images/community${i}.jpg`,
        description: `Community Image ${i}`,
      },
    ],
    faqs: [{ question: `FAQ question ${i}?`, answer: `FAQ answer ${i}.` }],
    seo: {
      meta_title: `Sample Community ${i}`,
      meta_description: `Detailed SEO description for Sample Community ${i}.`,
      keywords: ["community", "sample", "example"],
    },
    schema_org: {
      type: "Place",
      properties: { name: `Sample Community ${i}` },
    },
    open_graph: {
      title: `Sample Community ${i}`,
      description: `Open Graph description for Sample Community ${i}.`,
      image: `https://example.com/images/community${i}-og.jpg`,
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

const seedCommunity = async () => {
  try {
    await Community.deleteMany({});
    await Community.insertMany(communities);
  } catch (error) {
    console.error("Error seeding the database", error);
  }
};

connectToDB().then(() =>
  seedCommunity().then(() => mongoose.connection.close())
);
