const catchAsync = require("../utils/seedDB/catchAsync");
const Community = require("../models/community");
const propertyTypes = require("../configs/property-types.json");

module.exports = catchAsync(async (req, res) => {
    // Fetch unique community names from the database
    const communities = await Community.find({}, { name: 1, _id: 0 }).sort({ name: 1 });

    // Extract property type names from the JSON file
    const types = propertyTypes.map(type => ({
        name: type.name,
        // name_slug: type.name_slug
    }));

    res.status(200).json({
        success: true,
        data: {
            propertyTypes: types,
            communities: communities
        }
    });
});