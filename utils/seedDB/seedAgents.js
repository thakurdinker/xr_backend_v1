const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const mongoose = require("mongoose");
const Agent = require("../../models/agent");

const DB_URL = process.env.DB_URL;

const agents = [
  {
    name: "Sample Agent 1",
    name_slug: "sample-agent-1",
    email: "agent1@example.com",
    phone: "1234567890",
    profile_picture: "https://example.com/profile1.jpg",
    bio: "This is a professional snapshot of Sample Agent 1.",
    personal_info: "Some personal information about Sample Agent 1.",
    education: "Bachelor's Degree in Real Estate",
    experience: 5,
    specialties: ["Residential", "Commercial"],
    languages: ["English", "Spanish"],
    social_links: {
      linkedin: "https://linkedin.com/in/sampleagent1",
      twitter: "https://twitter.com/sampleagent1",
      facebook: "https://facebook.com/sampleagent1",
    },
    video_links: ["https://youtube.com/samplevideo1"],
    seo: {
      meta_title: "Sample Agent 1",
      meta_description: "SEO description for Sample Agent 1.",
      keywords: ["real estate", "agent", "sample"],
    },
    schema_org: {
      type: "Person",
      properties: { name: "Sample Agent 1" },
    },
    open_graph: {
      title: "Sample Agent 1",
      description: "Open Graph description for Sample Agent 1.",
      image: "https://example.com/profile1-og.jpg",
    },
  },
  // Add 19 more sample documents here...
];

// Repeat the above object 19 times with different values
for (let i = 2; i <= 20; i++) {
  agents.push({
    name: `Sample Agent ${i}`,
    name_slug: `sample-agent-${i}`,
    email: `agent${i}@example.com`,
    phone: `123456789${i}`,
    profile_picture: `https://example.com/profile${i}.jpg`,
    bio: `This is a professional snapshot of Sample Agent ${i}.`,
    personal_info: `Some personal information about Sample Agent ${i}.`,
    education: "Bachelor's Degree in Real Estate",
    experience: 3 + i,
    specialties:
      i % 2 === 0 ? ["Residential", "Commercial"] : ["Luxury", "Investment"],
    languages: i % 2 === 0 ? ["English", "Spanish"] : ["English", "French"],
    social_links: {
      linkedin: `https://linkedin.com/in/sampleagent${i}`,
      twitter: `https://twitter.com/sampleagent${i}`,
      facebook: `https://facebook.com/sampleagent${i}`,
    },
    video_links: [`https://youtube.com/samplevideo${i}`],
    seo: {
      meta_title: `Sample Agent ${i}`,
      meta_description: `SEO description for Sample Agent ${i}.`,
      keywords: ["real estate", "agent", "sample"],
    },
    schema_org: {
      type: "Person",
      properties: { name: `Sample Agent ${i}` },
    },
    open_graph: {
      title: `Sample Agent ${i}`,
      description: `Open Graph description for Sample Agent ${i}.`,
      image: `https://example.com/profile${i}-og.jpg`,
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

const seedAgents = async () => {
  try {
    await Agent.deleteMany({});
    await Agent.insertMany(agents);
    console.log("Agents seeded successfully");
  } catch (error) {
    console.error("Error seeding the database", error);
  }
};

connectToDB().then(() => seedAgents().then(() => mongoose.connection.close()));
