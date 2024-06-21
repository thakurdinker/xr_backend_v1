const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const mongoose = require("mongoose");
const Agent = require("../../models/agent");

const DB_URL = process.env.DB_URL;

const dummyAgents = [
  {
    name: "John Doe",
    name_slug: "john-doe",
    email: "john@example.com",
    phone: "123-456-7890",
    profile_picture: "http://example.com/john.jpg",
    bio: "John Doe is a seasoned real estate agent with over 10 years of experience in residential properties.",
    personal_info: "Passionate about helping clients.",
    education: "B.A. in Real Estate Management",
    experience: 10,
    specialties: ["residential", "investment properties"],
    languages: ["English", "Spanish"],
    social_links: {
      linkedin: "http://linkedin.com/in/johndoe",
      twitter: "http://twitter.com/johndoe",
      facebook: "http://facebook.com/johndoe",
    },
    video_links: [
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
    ],
    seo: {
      meta_title: "John Doe - Experienced Real Estate Agent",
      meta_description:
        "John Doe is an experienced real estate agent specializing in residential and investment properties.",
      keywords: ["real estate", "agent", "residential", "investment"],
    },
    schema_org: { type: "Person", properties: {} },
    open_graph: {
      title: "John Doe - Real Estate Agent",
      description: "Experienced in residential and investment properties.",
      image: "http://example.com/john.jpg",
    },
  },
  {
    name: "Jane Smith",
    name_slug: "jane-smith",
    email: "jane@example.com",
    phone: "234-567-8901",
    profile_picture: "http://example.com/jane.jpg",
    bio: "Jane Smith is a dedicated agent with a focus on commercial properties.",
    personal_info: "Loves working with businesses.",
    education: "M.A. in Business Administration",
    experience: 8,
    specialties: ["commercial", "office spaces"],
    languages: ["English", "French"],
    social_links: {
      linkedin: "http://linkedin.com/in/janesmith",
      twitter: "http://twitter.com/janesmith",
      facebook: "http://facebook.com/janesmith",
    },
    video_links: [
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
    ],
    seo: {
      meta_title: "Jane Smith - Commercial Real Estate Expert",
      meta_description:
        "Jane Smith specializes in commercial properties and office spaces.",
      keywords: ["commercial real estate", "agent", "office spaces"],
    },
    schema_org: { type: "Person", properties: {} },
    open_graph: {
      title: "Jane Smith - Real Estate Agent",
      description: "Expert in commercial properties and office spaces.",
      image: "http://example.com/jane.jpg",
    },
  },
  {
    name: "Alice Johnson",
    name_slug: "alice-johnson",
    email: "alice@example.com",
    phone: "345-678-9012",
    profile_picture: "http://example.com/alice.jpg",
    bio: "Alice Johnson is known for her expertise in luxury properties.",
    personal_info: "Enjoys luxury living.",
    education: "B.A. in Marketing",
    experience: 6,
    specialties: ["luxury homes", "vacation properties"],
    languages: ["English", "Italian"],
    social_links: {
      linkedin: "http://linkedin.com/in/alicejohnson",
      twitter: "http://twitter.com/alicejohnson",
      facebook: "http://facebook.com/alicejohnson",
    },
    video_links: [
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
    ],
    seo: {
      meta_title: "Alice Johnson - Luxury Real Estate Specialist",
      meta_description:
        "Alice Johnson specializes in luxury homes and vacation properties.",
      keywords: ["luxury real estate", "agent", "vacation properties"],
    },
    schema_org: { type: "Person", properties: {} },
    open_graph: {
      title: "Alice Johnson - Real Estate Agent",
      description: "Specialist in luxury homes and vacation properties.",
      image: "http://example.com/alice.jpg",
    },
  },
  {
    name: "Bob Brown",
    name_slug: "bob-brown",
    email: "bob@example.com",
    phone: "456-789-0123",
    profile_picture: "http://example.com/bob.jpg",
    bio: "Bob Brown has a wealth of knowledge in industrial properties.",
    personal_info: "Industrial property enthusiast.",
    education: "B.S. in Engineering",
    experience: 12,
    specialties: ["industrial", "warehouses"],
    languages: ["English", "German"],
    social_links: {
      linkedin: "http://linkedin.com/in/bobbrown",
      twitter: "http://twitter.com/bobbrown",
      facebook: "http://facebook.com/bobbrown",
    },
    video_links: [
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
    ],
    seo: {
      meta_title: "Bob Brown - Industrial Real Estate Expert",
      meta_description:
        "Bob Brown is an expert in industrial properties and warehouses.",
      keywords: ["industrial real estate", "agent", "warehouses"],
    },
    schema_org: { type: "Person", properties: {} },
    open_graph: {
      title: "Bob Brown - Real Estate Agent",
      description: "Expert in industrial properties and warehouses.",
      image: "http://example.com/bob.jpg",
    },
  },
  {
    name: "Chris Davis",
    name_slug: "chris-davis",
    email: "chris@example.com",
    phone: "567-890-1234",
    profile_picture: "http://example.com/chris.jpg",
    bio: "Chris Davis specializes in rental properties.",
    personal_info: "Rental property guru.",
    education: "B.A. in Economics",
    experience: 7,
    specialties: ["rental properties", "apartments"],
    languages: ["English", "Portuguese"],
    social_links: {
      linkedin: "http://linkedin.com/in/chrisdavis",
      twitter: "http://twitter.com/chrisdavis",
      facebook: "http://facebook.com/chrisdavis",
    },
    video_links: [
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
      "https://www.youtube.com/watch?v=KJwYBJMSbPI",
    ],
    seo: {
      meta_title: "Chris Davis - Rental Property Specialist",
      meta_description:
        "Chris Davis specializes in rental properties and apartments.",
      keywords: ["rental properties", "agent", "apartments"],
    },
    schema_org: { type: "Person", properties: {} },
    open_graph: {
      title: "Chris Davis - Real Estate Agent",
      description: "Specialist in rental properties and apartments.",
      image: "http://example.com/chris.jpg",
    },
  },
];

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
    await Agent.insertMany(dummyAgents);
    console.log("Agents seeded successfully");
  } catch (error) {
    console.error("Error seeding the database", error);
  }
};

connectToDB().then(() => seedAgents().then(() => mongoose.connection.close()));
