const Joi = require("joi");

const propertySchemaValidation = Joi.object({
  property_name: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.string().required(),
  type: Joi.array().items(Joi.string()).required(),
  location: Joi.object({
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    coordinates: Joi.object({
      lat: Joi.string().required(),
      lng: Joi.string().required(),
    }).required(),
  }).required(),
  features: Joi.object({
    bedrooms: Joi.string().required(),
    bathrooms: Joi.string().required(),
    area: Joi.string().required(),
    year_built: Joi.string().required(),
    amenities: Joi.array().items(Joi.string()).required(),
  }).required(),
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().required(),
        description: Joi.string().optional(),
      })
    )
    .required(),
  gallery: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().required(),
        description: Joi.string().optional(),
      })
    )
    .required(),
  status: Joi.array().items(Joi.string()).required(),
  community_name: Joi.string().required(),
  community_name_slug: Joi.string().required(),
  property_name_slug: Joi.string().required(),
  community_features: Joi.object({
    project_overview: Joi.string().required(),
    nearby_facilities: Joi.array().items(Joi.string()).required(),
    transportation: Joi.array().items(Joi.string()).required(),
  }).required(),
  starting_price: Joi.string().required(),
  show_property: Joi.boolean().required(),
  featured: Joi.boolean().required(),
});

const propertySchemaValidationUpdate = Joi.object({
  property_name: Joi.string().optional(),
  description: Joi.string().optional(),
  price: Joi.string().optional(),
  type: Joi.array().items(Joi.string()).optional(),
  location: Joi.object({
    address: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    country: Joi.string().optional(),
    coordinates: Joi.object({
      lat: Joi.string().optional(),
      lng: Joi.string().optional(),
    }).optional(),
  }).optional(),
  features: Joi.object({
    bedrooms: Joi.string().optional(),
    bathrooms: Joi.string().optional(),
    area: Joi.string().optional(),
    year_built: Joi.string().optional(),
    amenities: Joi.array().items(Joi.string()).optional(),
  }).optional(),
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().optional(),
        description: Joi.string().optional(),
      })
    )
    .optional(),
  gallery: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().optional(),
        description: Joi.string().optional(),
      })
    )
    .optional(),
  status: Joi.array().items(Joi.string()).optional(),
  community_name: Joi.string().optional(),
  community_name_slug: Joi.string().optional(),
  property_name_slug: Joi.string().optional(),
  community_features: Joi.object({
    project_overview: Joi.string().optional(),
    nearby_facilities: Joi.array().items(Joi.string()).optional(),
    transportation: Joi.array().items(Joi.string()).optional(),
  }).optional(),
  starting_price: Joi.string().optional(),
  show_property: Joi.boolean().optional(),
  featured: Joi.boolean().optional(),
});

module.exports = { propertySchemaValidation, propertySchemaValidationUpdate };
