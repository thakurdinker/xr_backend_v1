const mongoose = require("mongoose");

const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const DB_URL = process.env.DB_URL;

const HomePageVideos = require("../../models/homepageVideo");

async function seedHomePageVideos() {
  // Connect to the MongoDB database
  mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Agent IDs from the provided list
  const agentIds = [
    "668bd48b9d01e09d31047254",
    "668bd48b9d01e09d31047255",
    "668bd48b9d01e09d31047256",
    "668bd48b9d01e09d31047257",
    "668bd48b9d01e09d31047258",
    "668bd48b9d01e09d31047259",
    "668bd48b9d01e09d3104725a",
    "668bd48b9d01e09d3104725b",
    "668bd48b9d01e09d3104725c",
    "668bd48b9d01e09d3104725d",
  ];

  // Function to get a random agent ID from the list
  function getRandomAgentId() {
    return agentIds[Math.floor(Math.random() * agentIds.length)];
  }

  // Array of sample YouTube video URLs
  const youtubeUrls = [
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/3JZ_D3ELwOQ",
    "https://www.youtube.com/embed/lWA2pjMjpBs",
    "https://www.youtube.com/embed/e-ORhEE9VVg",
    "https://www.youtube.com/embed/OPf0YbXqDm0",
    "https://www.youtube.com/embed/2Vv-BfVoq4g",
    "https://www.youtube.com/embed/KQ6zr6kCPj8",
    "https://www.youtube.com/embed/9bZkp7q19f0",
    "https://www.youtube.com/embed/CevxZvSJLk8",
    "https://www.youtube.com/embed/7PCkvCPvDXk",
  ];

  // Function to get a random YouTube URL from the list
  function getRandomYoutubeUrl() {
    return youtubeUrls[Math.floor(Math.random() * youtubeUrls.length)];
  }

  // Array of sample homepage video data
  const homePageVideos = [];

  // Repeat the creation of video documents 20 times
  for (let i = 1; i <= 20; i++) {
    homePageVideos.push({
      mainVideo: {
        url: getRandomYoutubeUrl(),
        title: `Main Video ${i}`,
        agent: getRandomAgentId(),
      },
      videos: [
        {
          url: getRandomYoutubeUrl(),
          title: `Video ${i}a`,
          agent: getRandomAgentId(),
        },
        {
          url: getRandomYoutubeUrl(),
          title: `Video ${i}b`,
          agent: getRandomAgentId(),
        },
      ],
    });
  }

  try {
    // Insert the sample homepage video data into the collection
    await HomePageVideos.deleteMany({});
    await HomePageVideos.insertMany(homePageVideos);
    console.log("HomePageVideos collection seeded successfully!");
  } catch (error) {
    console.error("Error seeding HomePageVideos collection:", error);
  } finally {
    // Close the database connection
    await mongoose.disconnect();
  }
}

// Run the seed script
seedHomePageVideos();
