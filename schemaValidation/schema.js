const Joi = require("joi");

const propertySchemaValidation = Joi.object({
  property_name: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.string().required(),
  type: Joi.array().items(Joi.string()).required(),
  developer: Joi.string().optional(),
  developer_name_slug: Joi.string().optional(),
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
  community_name_slug: Joi.string().optional(),
  property_name_slug: Joi.string().optional(),
  community_features: Joi.object({
    project_overview: Joi.string().required(),
    nearby_facilities: Joi.array().items(Joi.string()).required(),
    transportation: Joi.array().items(Joi.string()).required(),
  }).required(),
  show_property: Joi.boolean().required(),
  featured: Joi.boolean().required(),
});

const propertySchemaValidationUpdate = Joi.object({
  property_name: Joi.string().optional(),
  description: Joi.string().optional(),
  price: Joi.string().optional(),
  type: Joi.array().items(Joi.string()).optional(),
  developer: Joi.string().optional(),
  developer_name_slug: Joi.string().optional(),
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
  show_property: Joi.boolean().optional(),
  featured: Joi.boolean().optional(),
});

// Content Schema validation
const contentValidationSchema = Joi.object({
  title: Joi.string().required(),
  slug: Joi.string().optional(),
  content: Joi.string().required(), // HTML content
  author: Joi.object({
    name: Joi.string().optional(),
    email: Joi.string().optional(),
  }).optional(),
  featured_image: Joi.string().optional(),
  category: Joi.string().required(),
  tags: Joi.array().items(Joi.string()).optional(),
  publish_date: Joi.date().optional(),
  status: Joi.string().valid("draft", "published").default("draft"),
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().optional(),
        description: Joi.string().optional(),
      })
    )
    .optional(),
  faqs: Joi.array()
    .items(
      Joi.object({
        question: Joi.string().required(),
        answer: Joi.string().required(),
      })
    )
    .optional(),
  meta_title: Joi.string().required(),
  meta_description: Joi.string().required(),
  keywords: Joi.array().items(Joi.string()).optional(),
  schema_org: Joi.object({
    type: Joi.string().default("Article"),
    properties: Joi.object().optional(),
  }).optional(),
  open_graph: Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    image: Joi.string().optional(),
    type: Joi.string().default("article"),
  }).optional(),
});

const contentUpdateValidationSchema = Joi.object({
  title: Joi.string().optional(),
  slug: Joi.string().optional(),
  content: Joi.string().optional(), // HTML content
  author: Joi.object({
    name: Joi.string().optional(),
    email: Joi.string().optional(),
  }).optional(),
  featured_image: Joi.string().optional(),
  category: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  publish_date: Joi.date().optional(),
  status: Joi.string().valid("draft", "published").default("draft"),
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().optional(),
        description: Joi.string().optional(),
      })
    )
    .optional(),
  faqs: Joi.array()
    .items(
      Joi.object({
        question: Joi.string().optional(),
        answer: Joi.string().optional(),
      })
    )
    .optional(),
  meta_title: Joi.string().optional(),
  meta_description: Joi.string().optional(),
  keywords: Joi.array().items(Joi.string()).optional(),
  schema_org: Joi.object({
    type: Joi.string().default("Article"),
    properties: Joi.object().optional(),
  }).optional(),
  open_graph: Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    image: Joi.string().optional(),
    type: Joi.string().default("article"),
  }).optional(),
});

// Agent validation
const agentValidationSchema = Joi.object({
  name: Joi.string().required(),
  name_slug: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  profile_picture: Joi.string().required(),
  bio: Joi.string().required(),
  personal_info: Joi.string().optional(),
  education: Joi.string().required(),
  experience: Joi.number().required(),
  specialties: Joi.array().items(Joi.string()).optional(),
  languages: Joi.array().items(Joi.string()).required(),
  social_links: Joi.object({
    linkedin: Joi.string().optional(),
    twitter: Joi.string().optional(),
    facebook: Joi.string().optional(),
  }).optional(),
  video_links: Joi.array().items(Joi.string()).optional(),
  seo: Joi.object({
    meta_title: Joi.string().required(),
    meta_description: Joi.string().required(),
    keywords: Joi.array().items(Joi.string()).optional(),
  }).required(),
  schema_org: Joi.object({
    type: Joi.string().default("Person"),
    properties: Joi.object().optional(),
  }).optional(),
  open_graph: Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    image: Joi.string().optional(),
  }).optional(),
});

const agentUpdateValidationSchema = Joi.object({
  name: Joi.string().optional(),
  name_slug: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  profile_picture: Joi.string().optional(),
  bio: Joi.string().optional(),
  personal_info: Joi.string().optional(),
  education: Joi.string().optional(),
  experience: Joi.number().optional(),
  specialties: Joi.array().items(Joi.string()).optional(),
  languages: Joi.array().items(Joi.string()).optional(),
  social_links: Joi.object({
    linkedin: Joi.string().optional(),
    twitter: Joi.string().optional(),
    facebook: Joi.string().optional(),
  }).optional(),
  video_links: Joi.array().items(Joi.string()).optional(),
  seo: Joi.object({
    meta_title: Joi.string().optional(),
    meta_description: Joi.string().optional(),
    keywords: Joi.array().items(Joi.string()).optional(),
  }).optional(),
  schema_org: Joi.object({
    type: Joi.string().default("Person"),
    properties: Joi.object().optional(),
  }).optional(),
  open_graph: Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    image: Joi.string().optional(),
  }).optional(),
});

// Community Validation

const communityValidationSchema = Joi.object({
  name: Joi.string().required(),
  slug: Joi.string().required(),
  description: Joi.string().optional(),
  location: Joi.object({
    address: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    country: Joi.string().optional(),
    coordinates: Joi.object({
      lat: Joi.number().optional(),
      lng: Joi.number().optional(),
    }).optional(),
  }).optional(),
  amenities: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().optional(),
        icon_url: Joi.string().optional(),
        description: Joi.string().optional(),
      })
    )
    .optional(),
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().optional(),
        description: Joi.string().optional(),
      })
    )
    .optional(),
  faqs: Joi.array()
    .items(
      Joi.object({
        question: Joi.string().optional(),
        answer: Joi.string().optional(),
      })
    )
    .optional(),
  seo: Joi.object({
    meta_title: Joi.string().optional(),
    meta_description: Joi.string().optional(),
    keywords: Joi.array().items(Joi.string()).optional(),
  }).optional(),
  schema_org: Joi.object({
    type: Joi.string().default("Place"),
    properties: Joi.object().optional(),
  }).optional(),
  open_graph: Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    image: Joi.string().optional(),
  }).optional(),
});

const communityUpdateValidationSchema = Joi.object({
  name: Joi.string().optional(),
  slug: Joi.string().optional(),
  description: Joi.string().optional(),
  location: Joi.object({
    address: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    country: Joi.string().optional(),
    coordinates: Joi.object({
      lat: Joi.number().optional(),
      lng: Joi.number().optional(),
    }).optional(),
  }).optional(),
  amenities: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().optional(),
        icon_url: Joi.string().optional(),
        description: Joi.string().optional(),
      })
    )
    .optional(),
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().optional(),
        description: Joi.string().optional(),
      })
    )
    .optional(),
  faqs: Joi.array()
    .items(
      Joi.object({
        question: Joi.string().optional(),
        answer: Joi.string().optional(),
      })
    )
    .optional(),
  seo: Joi.object({
    meta_title: Joi.string().optional(),
    meta_description: Joi.string().optional(),
    keywords: Joi.array().items(Joi.string()).optional(),
  }).optional(),
  schema_org: Joi.object({
    type: Joi.string().default("Place"),
    properties: Joi.object().optional(),
  }).optional(),
  open_graph: Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    image: Joi.string().optional(),
  }).optional(),
});

module.exports = {
  propertySchemaValidation,
  propertySchemaValidationUpdate,
  contentValidationSchema,
  contentUpdateValidationSchema,
  agentValidationSchema,
  agentUpdateValidationSchema,
  communityUpdateValidationSchema,
  communityValidationSchema,
};
