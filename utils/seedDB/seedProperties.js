const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const mongoose = require("mongoose");
const Property = require("../../models/properties");

const DB_URL = process.env.DB_URL;

const dummyProperties = [
  {
    property_name: "Luxury Townhouse",
    description: "A beautiful luxury townhouse with modern amenities.",
    price: "500000",
    type: ["townhouse"],
    location: {
      address: "123 Main St",
      city: "Dubai",
      state: "Dubai",
      country: "UAE",
      coordinates: {
        lat: "25.276987",
        lng: "55.296249",
      },
    },
    features: {
      bedrooms: "3",
      bathrooms: "2",
      area: "1500",
      year_built: "2019",
      amenities: ["swimming pool", "gym"],
    },
    images: [
      { url: "http://example.com/image1.jpg", description: "Front view" },
      { url: "http://example.com/image2.jpg", description: "Living room" },
    ],
    gallery: [
      { url: "http://example.com/gallery1.jpg", description: "Bedroom" },
      { url: "http://example.com/gallery2.jpg", description: "Kitchen" },
    ],
    status: ["available"],
    community_name: "Greenway",
    community_name_slug: "greenway",
    property_name_slug: "luxury-townhouse",
    community_features: {
      project_overview: "A vibrant community with all modern facilities.",
      nearby_facilities: ["school", "hospital"],
      transportation: ["Metro station", "Bus stop"],
    },
    starting_price: "450000",
    show_property: true,
    featured: true,
  },
  {
    title: "Modern Apartment",
    description: "A spacious modern apartment in the heart of the city.",
    price: "300000",
    type: ["apartment"],
    location: {
      address: "456 Central Ave",
      city: "Dubai",
      state: "Dubai",
      country: "UAE",
      coordinates: {
        lat: "25.204849",
        lng: "55.270782",
      },
    },
    features: {
      bedrooms: "2",
      bathrooms: "2",
      area: "1000",
      year_built: "2018",
      amenities: ["gym", "parking"],
    },
    images: [
      {
        url: "http://example.com/image3.jpg",
        description: "Building exterior",
      },
      { url: "http://example.com/image4.jpg", description: "Living room" },
    ],
    gallery: [
      { url: "http://example.com/gallery3.jpg", description: "Bedroom" },
      { url: "http://example.com/gallery4.jpg", description: "Kitchen" },
    ],
    status: ["available"],
    community_name: "City Heights",
    community_name_slug: "city-heights",
    property_name_slug: "modern-apartment",
    community_features: {
      project_overview: "A bustling urban community.",
      nearby_facilities: ["mall", "park"],
      transportation: ["Metro station", "Bus stop"],
    },
    starting_price: "290000",
    show_property: true,
    featured: false,
  },
  // Add 8 more properties similarly
  {
    title: "Elegant Villa",
    description: "A luxurious villa with private garden and pool.",
    price: "800000",
    type: ["villa"],
    location: {
      address: "789 Palm St",
      city: "Dubai",
      state: "Dubai",
      country: "UAE",
      coordinates: {
        lat: "25.15053",
        lng: "55.205307",
      },
    },
    features: {
      bedrooms: "5",
      bathrooms: "4",
      area: "2500",
      year_built: "2020",
      amenities: ["pool", "garden", "garage"],
    },
    images: [
      { url: "http://example.com/image5.jpg", description: "Front view" },
      { url: "http://example.com/image6.jpg", description: "Living room" },
    ],
    gallery: [
      { url: "http://example.com/gallery5.jpg", description: "Bedroom" },
      { url: "http://example.com/gallery6.jpg", description: "Kitchen" },
    ],
    status: ["available"],
    community_name: "Palm Villas",
    community_name_slug: "palm-villas",
    property_name_slug: "elegant-villa",
    community_features: {
      project_overview: "A serene villa community.",
      nearby_facilities: ["beach", "school"],
      transportation: ["Taxi service"],
    },
    starting_price: "750000",
    show_property: true,
    featured: true,
  },
  // ...6 more properties
];

const connectToDB = async () => {
  mongoose.connect(DB_URL);
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error: "));
  db.once("open", () => {
    console.log("Database connected");
  });
};

const seedProperties = async () => {
  try {
    await Property.deleteMany({});
    console.log("Properties deleted Successfully");
    await Property.insertMany(dummyProperties);
    console.log("Properties seeded successfully");
  } catch (error) {
    console.error("Error seeding the database", error);
  }
};

connectToDB().then(() =>
  seedProperties().then(() => mongoose.connection.close())
);
