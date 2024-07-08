const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const mongoose = require("mongoose");
const Agent = require("../../models/agent");

const DB_URL = process.env.DB_URL;
const agents = [
  {
    _id: "668bd48b9d01e09d31047254",
    name: "Sample Agent 1",
    name_slug: "sample-agent-1",
    email: "agent1@example.com",
    phone: "1234567890",
    profile_picture:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
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
  {
    _id: "668bd48b9d01e09d31047255",
    name: "Sample Agent 2",
    name_slug: "sample-agent-2",
    email: "agent2@example.com",
    phone: "1234567892",
    profile_picture:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    bio: "This is a professional snapshot of Sample Agent 2.",
    personal_info: "Some personal information about Sample Agent 2.",
    education: "Bachelor's Degree in Real Estate",
    experience: 6,
    specialties: ["Luxury Homes"],
    languages: ["English", "Spanish"],
    social_links: {
      linkedin: "https://linkedin.com/in/sampleagent2",
      twitter: "https://twitter.com/sampleagent2",
      facebook: "https://facebook.com/sampleagent2",
    },
    video_links: ["https://youtube.com/samplevideo2"],
    seo: {
      meta_title: "Sample Agent 2",
      meta_description: "SEO description for Sample Agent 2.",
      keywords: ["real estate", "agent", "sample"],
    },
    schema_org: {
      type: "Person",
      properties: { name: "Sample Agent 2" },
    },
    open_graph: {
      title: "Sample Agent 2",
      description: "Open Graph description for Sample Agent 2.",
      image: "https://example.com/profile2-og.jpg",
    },
  },
  {
    _id: "668bd48b9d01e09d31047256",
    name: "Sample Agent 3",
    name_slug: "sample-agent-3",
    email: "agent3@example.com",
    phone: "1234567893",
    profile_picture:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    bio: "This is a professional snapshot of Sample Agent 3.",
    personal_info: "Some personal information about Sample Agent 3.",
    education: "Bachelor's Degree in Real Estate",
    experience: 7,
    specialties: ["Commercial Properties"],
    languages: ["English", "French"],
    social_links: {
      linkedin: "https://linkedin.com/in/sampleagent3",
      twitter: "https://twitter.com/sampleagent3",
      facebook: "https://facebook.com/sampleagent3",
    },
    video_links: ["https://youtube.com/samplevideo3"],
    seo: {
      meta_title: "Sample Agent 3",
      meta_description: "SEO description for Sample Agent 3.",
      keywords: ["real estate", "agent", "sample"],
    },
    schema_org: {
      type: "Person",
      properties: { name: "Sample Agent 3" },
    },
    open_graph: {
      title: "Sample Agent 3",
      description: "Open Graph description for Sample Agent 3.",
      image: "https://example.com/profile3-og.jpg",
    },
  },
  {
    _id: "668bd48b9d01e09d31047257",
    name: "Sample Agent 4",
    name_slug: "sample-agent-4",
    email: "agent4@example.com",
    phone: "1234567894",
    profile_picture:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    bio: "This is a professional snapshot of Sample Agent 4.",
    personal_info: "Some personal information about Sample Agent 4.",
    education: "Bachelor's Degree in Real Estate",
    experience: 8,
    specialties: ["Residential", "Commercial"],
    languages: ["English", "Spanish"],
    social_links: {
      linkedin: "https://linkedin.com/in/sampleagent4",
      twitter: "https://twitter.com/sampleagent4",
      facebook: "https://facebook.com/sampleagent4",
    },
    video_links: ["https://youtube.com/samplevideo4"],
    seo: {
      meta_title: "Sample Agent 4",
      meta_description: "SEO description for Sample Agent 4.",
      keywords: ["real estate", "agent", "sample"],
    },
    schema_org: {
      type: "Person",
      properties: { name: "Sample Agent 4" },
    },
    open_graph: {
      title: "Sample Agent 4",
      description: "Open Graph description for Sample Agent 4.",
      image: "https://example.com/profile4-og.jpg",
    },
  },
  {
    _id: "668bd48b9d01e09d31047258",
    name: "Sample Agent 5",
    name_slug: "sample-agent-5",
    email: "agent5@example.com",
    phone: "1234567895",
    profile_picture:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    bio: "This is a professional snapshot of Sample Agent 5.",
    personal_info: "Some personal information about Sample Agent 5.",
    education: "Bachelor's Degree in Real Estate",
    experience: 9,
    specialties: ["Luxury Homes"],
    languages: ["English", "French"],
    social_links: {
      linkedin: "https://linkedin.com/in/sampleagent5",
      twitter: "https://twitter.com/sampleagent5",
      facebook: "https://facebook.com/sampleagent5",
    },
    video_links: ["https://youtube.com/samplevideo5"],
    seo: {
      meta_title: "Sample Agent 5",
      meta_description: "SEO description for Sample Agent 5.",
      keywords: ["real estate", "agent", "sample"],
    },
    schema_org: {
      type: "Person",
      properties: { name: "Sample Agent 5" },
    },
    open_graph: {
      title: "Sample Agent 5",
      description: "Open Graph description for Sample Agent 5.",
      image: "https://example.com/profile5-og.jpg",
    },
  },
  {
    _id: "668bd48b9d01e09d31047259",
    name: "Sample Agent 6",
    name_slug: "sample-agent-6",
    email: "agent6@example.com",
    phone: "1234567896",
    profile_picture:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    bio: "This is a professional snapshot of Sample Agent 6.",
    personal_info: "Some personal information about Sample Agent 6.",
    education: "Bachelor's Degree in Real Estate",
    experience: 10,
    specialties: ["Investment Properties"],
    languages: ["English", "Spanish"],
    social_links: {
      linkedin: "https://linkedin.com/in/sampleagent6",
      twitter: "https://twitter.com/sampleagent6",
      facebook: "https://facebook.com/sampleagent6",
    },
    video_links: ["https://youtube.com/samplevideo6"],
    seo: {
      meta_title: "Sample Agent 6",
      meta_description: "SEO description for Sample Agent 6.",
      keywords: ["real estate", "agent", "sample"],
    },
    schema_org: {
      type: "Person",
      properties: { name: "Sample Agent 6" },
    },
    open_graph: {
      title: "Sample Agent 6",
      description: "Open Graph description for Sample Agent 6.",
      image: "https://example.com/profile6-og.jpg",
    },
  },
  {
    _id: "668bd48b9d01e09d3104725a",
    name: "Sample Agent 7",
    name_slug: "sample-agent-7",
    email: "agent7@example.com",
    phone: "1234567897",
    profile_picture:
      "https://images.unsplash.com/photo-1530577197743-7adf14294584?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    bio: "This is a professional snapshot of Sample Agent 7.",
    personal_info: "Some personal information about Sample Agent 7.",
    education: "Bachelor's Degree in Real Estate",
    experience: 11,
    specialties: ["Commercial Properties"],
    languages: ["English", "French"],
    social_links: {
      linkedin: "https://linkedin.com/in/sampleagent7",
      twitter: "https://twitter.com/sampleagent7",
      facebook: "https://facebook.com/sampleagent7",
    },
    video_links: ["https://youtube.com/samplevideo7"],
    seo: {
      meta_title: "Sample Agent 7",
      meta_description: "SEO description for Sample Agent 7.",
      keywords: ["real estate", "agent", "sample"],
    },
    schema_org: {
      type: "Person",
      properties: { name: "Sample Agent 7" },
    },
    open_graph: {
      title: "Sample Agent 7",
      description: "Open Graph description for Sample Agent 7.",
      image: "https://example.com/profile7-og.jpg",
    },
  },
  {
    _id: "668bd48b9d01e09d3104725b",
    name: "Sample Agent 8",
    name_slug: "sample-agent-8",
    email: "agent8@example.com",
    phone: "1234567898",
    profile_picture:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    bio: "This is a professional snapshot of Sample Agent 8.",
    personal_info: "Some personal information about Sample Agent 8.",
    education: "Bachelor's Degree in Real Estate",
    experience: 12,
    specialties: ["Residential", "Commercial"],
    languages: ["English", "Spanish"],
    social_links: {
      linkedin: "https://linkedin.com/in/sampleagent8",
      twitter: "https://twitter.com/sampleagent8",
      facebook: "https://facebook.com/sampleagent8",
    },
    video_links: ["https://youtube.com/samplevideo8"],
    seo: {
      meta_title: "Sample Agent 8",
      meta_description: "SEO description for Sample Agent 8.",
      keywords: ["real estate", "agent", "sample"],
    },
    schema_org: {
      type: "Person",
      properties: { name: "Sample Agent 8" },
    },
    open_graph: {
      title: "Sample Agent 8",
      description: "Open Graph description for Sample Agent 8.",
      image: "https://example.com/profile8-og.jpg",
    },
  },
  {
    _id: "668bd48b9d01e09d3104725c",
    name: "Sample Agent 9",
    name_slug: "sample-agent-9",
    email: "agent9@example.com",
    phone: "1234567899",
    profile_picture:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    bio: "This is a professional snapshot of Sample Agent 9.",
    personal_info: "Some personal information about Sample Agent 9.",
    education: "Bachelor's Degree in Real Estate",
    experience: 13,
    specialties: ["Luxury Homes"],
    languages: ["English", "French"],
    social_links: {
      linkedin: "https://linkedin.com/in/sampleagent9",
      twitter: "https://twitter.com/sampleagent9",
      facebook: "https://facebook.com/sampleagent9",
    },
    video_links: ["https://youtube.com/samplevideo9"],
    seo: {
      meta_title: "Sample Agent 9",
      meta_description: "SEO description for Sample Agent 9.",
      keywords: ["real estate", "agent", "sample"],
    },
    schema_org: {
      type: "Person",
      properties: { name: "Sample Agent 9" },
    },
    open_graph: {
      title: "Sample Agent 9",
      description: "Open Graph description for Sample Agent 9.",
      image: "https://example.com/profile9-og.jpg",
    },
  },
  {
    _id: "668bd48b9d01e09d3104725d",
    name: "Sample Agent 10",
    name_slug: "sample-agent-10",
    email: "agent10@example.com",
    phone: "12345678910",
    profile_picture:
      "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    bio: "This is a professional snapshot of Sample Agent 10.",
    personal_info: "Some personal information about Sample Agent 10.",
    education: "Bachelor's Degree in Real Estate",
    experience: 14,
    specialties: ["Investment Properties"],
    languages: ["English", "Spanish"],
    social_links: {
      linkedin: "https://linkedin.com/in/sampleagent10",
      twitter: "https://twitter.com/sampleagent10",
      facebook: "https://facebook.com/sampleagent10",
    },
    video_links: ["https://youtube.com/samplevideo10"],
    seo: {
      meta_title: "Sample Agent 10",
      meta_description: "SEO description for Sample Agent 10.",
      keywords: ["real estate", "agent", "sample"],
    },
    schema_org: {
      type: "Person",
      properties: { name: "Sample Agent 10" },
    },
    open_graph: {
      title: "Sample Agent 10",
      description: "Open Graph description for Sample Agent 10.",
      image: "https://example.com/profile10-og.jpg",
    },
  },
];

// Repeat the above object 19 times with different values
// for (let i = 2; i <= 20; i++) {
//   agents.push({
//     name: `Sample Agent ${i}`,
//     name_slug: `sample-agent-${i}`,
//     email: `agent${i}@example.com`,
//     phone: `123456789${i}`,
//     profile_picture: `https://example.com/profile${i}.jpg`,
//     bio: `This is a professional snapshot of Sample Agent ${i}.`,
//     personal_info: `Some personal information about Sample Agent ${i}.`,
//     education: "Bachelor's Degree in Real Estate",
//     experience: 3 + i,
//     specialties:
//       i % 2 === 0 ? ["Residential", "Commercial"] : ["Luxury", "Investment"],
//     languages: i % 2 === 0 ? ["English", "Spanish"] : ["English", "French"],
//     social_links: {
//       linkedin: `https://linkedin.com/in/sampleagent${i}`,
//       twitter: `https://twitter.com/sampleagent${i}`,
//       facebook: `https://facebook.com/sampleagent${i}`,
//     },
//     video_links: [`https://youtube.com/samplevideo${i}`],
//     seo: {
//       meta_title: `Sample Agent ${i}`,
//       meta_description: `SEO description for Sample Agent ${i}.`,
//       keywords: ["real estate", "agent", "sample"],
//     },
//     schema_org: {
//       type: "Person",
//       properties: { name: `Sample Agent ${i}` },
//     },
//     open_graph: {
//       title: `Sample Agent ${i}`,
//       description: `Open Graph description for Sample Agent ${i}.`,
//       image: `https://example.com/profile${i}-og.jpg`,
//     },
//   });
// }

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
