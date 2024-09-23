const fs = require("fs");
const { default: mongoose } = require("mongoose");

const dotenv = require("dotenv");

const path = require("path");
const Developer = require("../../models/developer");
const Community = require("../../models/community");
const Property = require("../../models/properties");
const Content = require("../../models/content");
const Agent = require("../../models/agent");
const Review = require("../../models/reviewsForm");
dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const DB_URL =
  process.env.ENV === "development"
    ? process.env.TEST_DB_URL
    : process.env.DB_URL;

const generateSitemap = async () => {
  //   mongoose.connect(DB_URL);

  //   const db = mongoose.connection;

  //   db.on("error", console.error.bind(console, "connection error: "));

  //   db.once("open", () => {
  //     console.log("Database connected");
  //   });

  const developers = await Developer.find({});

  const communities = await Community.find({});
  const properties = await Property.find({ show_property: true });
  const newsAndArticles = await Content.find({ status: "published" });
  const agents = await Agent.find({ hidden: false });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
    <loc>https://www.xrealty.ae/</loc>
</url>
<url>
    <loc>https://www.xrealty.ae/privacy-policy</loc>
</url>
<url>
    <loc>https://www.xrealty.ae/contact-us-dubai-real-estate-agency</loc>
</url>
<url>
    <loc>https://www.xrealty.ae/about-us</loc>
</url>
<url>
    <loc>https://www.xrealty.ae/meet-the-xr</loc>
</url>
<url>
    <loc>https://www.xrealty.ae/real-estate-news</loc>
</url>
<url>
    <loc>https://www.xrealty.ae/dubai-properties</loc>
</url>
<url>
    <loc>https://www.xrealty.ae/communities</loc>
</url>
<url>
    <loc>https://www.xrealty.ae/customer-reviews</loc>
</url>

${
  // Developers sitemap
  developers.length > 0 &&
  developers
    .map((developer) => {
      let developerSlug = encodeURIComponent(developer.developer_slug);
      return `
          <url>
              <loc>${`https://www.xrealty.ae/label/${developerSlug}`}</loc>
              <lastmod>${new Date(developer.updatedAt).toISOString()}</lastmod>
          </url>
          `;
    })
    .join("")
}

${
  //   Community Sitemap
  communities.length > 0 &&
  communities
    .map((community) => {
      let communitySlug = encodeURIComponent(community.slug);
      return `
            <url>
                <loc>${`https://www.xrealty.ae/area/${communitySlug}`}</loc>
                <lastmod>${new Date(
                  community.updatedAt
                ).toISOString()}</lastmod>
            </url>
            `;
    })
    .join("")
}

${
  //   Property Sitemap
  properties.length > 0 &&
  properties
    .map((property) => {
      let propertyNameSlug = encodeURIComponent(property.property_name_slug);
      return `
              <url> 
                  <loc>${`https://www.xrealty.ae/property/${propertyNameSlug}`}</loc>
                  <lastmod>${new Date(
                    property.updatedAt
                  ).toISOString()}</lastmod>
              </url>
              `;
    })
    .join("")
}

${
  //   News and Articles sitemap
  newsAndArticles.length > 0 &&
  newsAndArticles
    .map((newsAndArticle) => {
      let newsArticleSlug = encodeURIComponent(newsAndArticle.slug);
      return `
                <url>
                    <loc>${`https://www.xrealty.ae/${newsArticleSlug}`}</loc>
                    <lastmod>${new Date(
                      newsAndArticle.updatedAt
                    ).toISOString()}</lastmod>
                </url>
                `;
    })
    .join("")
}

${
  //   Agent sitemap
  agents.length > 0 &&
  agents
    .map((agent) => {
      let agentSlug = encodeURIComponent(agent.name_slug);
      return `
                  <url>
                      <loc>${`https://www.xrealty.ae/agent/${agentSlug}`}</loc>
                      <lastmod>${new Date(
                        agent.updatedAt
                      ).toISOString()}</lastmod>
                  </url>
                  `;
    })
    .join("")
}

</urlset>
`;

  try {
    fs.writeFileSync(
      path.join(__dirname, "../../public/sitemap.xml"),
      sitemap,
      {
        encoding: "utf8",
      }
    );
    console.log("genarated Sitemap successfully");
    return true;
  } catch (err) {
    console.log("Error generating sitemap");
    return false;
  }
  return;
};

// generateSitemap().then(() => mongoose.connection.close());

module.exports = generateSitemap;
