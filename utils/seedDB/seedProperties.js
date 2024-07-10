const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const mongoose = require("mongoose");
const Property = require("../../models/properties");

const DB_URL = process.env.DB_URL;

const { faker } = require("@faker-js/faker");

// Array of sample property data
// const properties = [
//   {
//     property_name: "Sample Property 1",
//     property_name_slug: "sample-property-1",
//     description: "This is a sample description for property 1",
//     price: "1000000",
//     developer: "Developer 1",
//     developer_name_slug: "developer-1",
//     type: ["townhouse"],
//     location: {
//       address: "123 Sample Street",
//       city: "Sample City",
//       state: "Sample State",
//       country: "Sample Country",
//       coordinates: {
//         lat: "25.276987",
//         lng: "55.296249",
//       },
//     },
//     features: {
//       bedrooms: "3",
//       bathrooms: "2",
//       area: "1500 sq ft",
//       year_built: "2020",
//       amenities: ["kids' play area", "skate park"],
//     },
//     images: [{ url: "https://example.com/image1.jpg", description: "Image 1" }],
//     gallery: [
//       { url: "https://example.com/gallery1.jpg", description: "Gallery 1" },
//     ],
//     status: ["for sale", "latest"],
//     community_name: "Sample Community 1",
//     community_name_slug: "sample-community-1",
//     community_features: {
//       project_overview: "This is a sample project overview for community 1",
//       nearby_facilities: ["hospital", "school"],
//       transportation: ["Al Maktoum Intl' Airport", "District 2020"],
//     },
//     show_property: true,
//     featured: false,
//   },
//   // Add 19 more sample documents here...
// ];

const propertyTemplate = {
  property_name: "Sunset Villa",
  property_name_slug: "sunset-villa",
  description: "A beautiful villa with stunning sunset views.",
  price: "AED 3,500,000",
  developer: "Sunrise Developments",
  developer_name_slug: "sunrise-developments",
  type: ["villa"],
  location: {
    address: "123 Sunset Blvd",
    city: "Dubai",
    state: "Dubai",
    country: "UAE",
    coordinates: {
      lat: "25.2048",
      lng: "55.2708",
    },
  },
  features: {
    bedrooms: "5",
    bathrooms: "4",
    area: "4500",
    year_built: "2020",
  },

  images: [
    {
      heading: "Front View",
      url: "https://picsum.photos/1920/1080",
      description: "Front view of the villa",
    },
    {
      heading: "Living Room",
      url: "https://picsum.photos/1920/1080",
      description: "Spacious living room",
    },
    {
      heading: "Kitchen",
      url: "https://picsum.photos/1920/1080",
      description: "Modern kitchen",
    },
    {
      heading: "Bedroom 1",
      url: "https://picsum.photos/1920/1080",
      description: "Master bedroom",
    },
    {
      heading: "Bedroom 2",
      url: "https://picsum.photos/1920/1080",
      description: "Guest bedroom",
    },
    {
      heading: "Bathroom",
      url: "https://picsum.photos/1920/1080",
      description: "Luxury bathroom",
    },
    {
      heading: "Pool",
      url: "https://picsum.photos/1920/1080",
      description: "Private pool",
    },
    {
      heading: "Garden",
      url: "https://picsum.photos/1920/1080",
      description: "Beautiful garden",
    },
    {
      heading: "Dining Area",
      url: "https://picsum.photos/1920/1080",
      description: "Dining area",
    },
    {
      heading: "Terrace",
      url: "https://picsum.photos/1920/1080",
      description: "Terrace with a view",
    },
  ],
  gallery_title_1: "Interior Views",
  gallery_title_2: "Exterior Views",
  gallery_description_1: "Beautifully designed interiors.",
  gallery_description_2: "Stunning exteriors.",
  gallery: [
    "https://picsum.photos/1920/1080",
    "https://picsum.photos/1920/1080",
    "https://picsum.photos/1920/1080",
    "https://picsum.photos/1920/1080",
    "https://picsum.photos/1920/1080",
    "https://picsum.photos/1920/1080",
    "https://picsum.photos/1920/1080",
    "https://picsum.photos/1920/1080",
    "https://picsum.photos/1920/1080",
    "https://picsum.photos/1920/1080",
  ],
  status: ["for sale"],
  community_name: "Sunset Community",
  community_name_slug: "sunset-community",
  community_features: {
    project_overview: "A community with all amenities and close to the beach.",
    nearby_facilities: ["hospital", "school"],
    transportation: ["Al Maktoum Intl' Airport"],
  },
  show_property: true,
  featured: true,
  section_1: {
    heading: "About the Villa",
    title: "Sunset Villa",
    description: "Luxurious villa with all modern amenities.",
  },
  about_project: {
    heading: "Project Overview",
    title: "Sunset Villas Project",
    description: "A premium villa project by Sunrise Developments.",
  },
  amenities: {
    description: "Pool, Gym, Garden",
    icons: [
      {
        icon_url: "https://picsum.photos/800/600",
        icon_text: "Pool",
      },
      {
        icon_url: "https://picsum.photos/800/600",
        icon_text: "Gym",
      },
      {
        icon_url: "https://picsum.photos/800/600",
        icon_text: "Garden",
      },
      {
        icon_url: "https://picsum.photos/800/600",
        icon_text: "Parking",
      },
      {
        icon_url: "https://picsum.photos/800/600",
        icon_text: "Security",
      },
      {
        icon_url: "https://picsum.photos/800/600",
        icon_text: "WiFi",
      },
    ],
  },
  faqs: [
    {
      question: "What is the price?",
      answer: "AED 3,500,000",
    },
    {
      question: "How many bedrooms?",
      answer: "5 bedrooms",
    },
  ],
  seo: {
    meta_title: "Sunset Villa for Sale in Dubai",
    meta_description:
      "Luxurious 5 bedroom villa for sale in Sunset Community, Dubai.",
    keywords: ["villa", "dubai", "real estate", "luxury"],
  },
  schema_org: {
    type: "House",
    properties: {
      name: "Sunset Villa",
      description: "Luxurious villa for sale",
      price: "AED 3,500,000",
    },
  },
  open_graph: {
    title: "Sunset Villa for Sale in Dubai",
    description:
      "Luxurious 5 bedroom villa for sale in Sunset Community, Dubai.",
    image: "https://picsum.photos/800/600",
    type: "website",
  },
};

const properties = [];

for (let i = 1; i <= 20; i++) {
  let property = { ...propertyTemplate };
  property.property_name = `Property ${i}`;
  property.property_name_slug = `property-${i}`;
  property.location.address = `Address ${i}`;
  property.images = property.images.map((image, index) => ({
    ...image,
    url: "https://picsum.photos/1920/1080",
  }));
  property.gallery = property.gallery.map(
    (url, index) => "https://picsum.photos/1920/1080"
  );
  property.amenities.icons = property.amenities.icons.map((icon, index) => ({
    ...icon,
    icon_url: "https://picsum.photos/800/600",
  }));
  properties.push(property);
}
// Repeat the above object 19 times with different values
// for (let i = 2; i <= 20; i++) {
//   properties.push({
//     property_name: `Sample Property ${i}`,
//     property_name_slug: `sample-property-${i}`,
//     description: `This is a sample description for property ${i}`,
//     price: `${1000000 + i * 10000}`,
//     developer: `Developer ${i}`,
//     developer_name_slug: `developer-${i}`,
//     type: i % 3 === 0 ? ["semi-detached home"] : ["townhouse"],
//     location: {
//       address: `123 Sample Street ${i}`,
//       city: "Sample City",
//       state: "Sample State",
//       country: "Sample Country",
//       coordinates: {
//         lat: `${25.276987 + i * 0.01}`,
//         lng: `${55.296249 + i * 0.01}`,
//       },
//     },
//     features: {
//       bedrooms: `${2 + (i % 3)}`,
//       bathrooms: `${1 + (i % 2)}`,
//       area: `${1500 + i * 50} sq ft`,
//       year_built: `${2020 + (i % 5)}`,
//       amenities: ["kids' play area", "skate park"],
//     },
//     images: [
//       { url: `https://example.com/image${i}.jpg`, description: `Image ${i}` },
//     ],
//     gallery: [
//       {
//         url: `https://example.com/gallery${i}.jpg`,
//         description: `Gallery ${i}`,
//       },
//     ],
//     status: i % 2 === 0 ? ["for sale"] : ["off-plan"],
//     community_name: `Sample Community ${i}`,
//     community_name_slug: `sample-community-${i}`,
//     community_features: {
//       project_overview: `This is a sample project overview for community ${i}`,
//       nearby_facilities: ["hospital", "school"],
//       transportation: ["Al Maktoum Intl' Airport", "District 2020"],
//     },
//     show_property: i % 2 === 0,
//     featured: i % 3 === 0,
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

const seedProperties = async () => {
  try {
    await Property.deleteMany({});
    console.log("Properties deleted Successfully");
    // for (let i = 0; i < 20; i++) {
    //   const property = createProperty();
    //   await Property.create(property);
    // }
    await Property.insertMany(properties);
    console.log("Properties seeded successfully");
  } catch (error) {
    console.error("Error seeding the database", error);
  }
};

connectToDB().then(() =>
  seedProperties().then(() => mongoose.connection.close())
);
