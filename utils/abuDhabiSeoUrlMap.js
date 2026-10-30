// Abu Dhabi landing pages → internal listing routes (same rewrite as
// seoUrlMap.js). Kept apart from seoUrlMap on purpose: every seoUrlMap key is
// published in the main /sitemap.xml, whereas these pages belong in the Abu
// Dhabi sitemap, and only once they have something to show.
module.exports = {
    "/off-plan-projects-for-sale-in-abu-dhabi/": "/abu-dhabi-properties/for-sale/type-off-plan-projects/",
    "/apartments-for-sale-in-abu-dhabi/": "/abu-dhabi-properties/for-sale/type-apartment/",
    "/villas-for-sale-in-abu-dhabi/": "/abu-dhabi-properties/for-sale/type-villa/",
};
