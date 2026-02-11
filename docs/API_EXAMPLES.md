# API Examples (Request/Response)

These examples are representative. Replace host, IDs, and credentials with real values.

## Auth

### Login (Admin)

```bash
curl -i -X POST \
  http://localhost:3333/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

Response:

```json
{ "success": true, "message": "DONE" }
```

### Current User

```bash
curl -i -X GET \
  http://localhost:3333/admin/currentuser \
  -H "Content-Type: application/json" \
  --cookie "session=YOUR_SESSION_COOKIE"
```

Response (logged in):

```json
{ "success": true, "isLoggedIn": true, "user": { "_id": "...", "role": { "role_name": "admin" } }, "message": "DONE" }
```

Response (not logged in):

```json
{ "success": false, "isLoggedIn": false, "user": null, "message": "DONE" }
```

## Properties

### Create Property (Admin)

```bash
curl -X POST http://localhost:3333/admin/properties \
  -H "Content-Type: application/json" \
  --cookie "session=YOUR_SESSION_COOKIE" \
  -d '{
    "property_name": "Sample Property",
    "property_name_slug": "sample-property",
    "price": "AED 2,500,000",
    "developer": "XR Developer",
    "developer_name_slug": "xr-developer",
    "type": [{ "name": "apartment", "bedrooms": "2" }],
    "location": { "city": "Dubai" },
    "show_property": true,
    "featured": true,
    "order": 100
  }'
```

Response:

```json
{ "success": true, "isCreated": true, "message": "DONE" }
```

### List Properties (Public)

```bash
curl -X GET "http://localhost:3333/dubai-properties?page=1&limit=10&sortOrder=1"
```

Response:

```json
{
  "success": true,
  "properties": [
    {
      "_id": "...",
      "property_name": "Sample Property",
      "property_name_slug": "sample-property",
      "price": "AED 2,500,000"
    }
  ],
  "pageHeading": "",
  "pageDescription": "",
  "totalPages": 12,
  "currentPage": 1
}
```

### Property Detail (Public)

```bash
curl -X GET "http://localhost:3333/property/sample-property"
```

Response:

```json
{ "success": true, "property": { "_id": "...", "property_name": "Sample Property" }, "message": "DONE" }
```

## Agents

### List Agents (Public Page)

```bash
curl -X GET "http://localhost:3333/meet-the-xr"
```

Response:

```json
{ "success": true, "agents": [ { "_id": "...", "name": "Agent Name" } ], "message": "DONE" }
```

### Agent Detail

```bash
curl -X GET "http://localhost:3333/agent/agent-name-slug"
```

Response:

```json
{ "success": true, "agent": { "_id": "...", "name": "Agent Name" }, "moreOfTheTeam": [], "message": "DONE" }
```

## Communities

### Community List

```bash
curl -X GET "http://localhost:3333/area/communities"
```

### Community Detail

```bash
curl -X GET "http://localhost:3333/area/downtown-dubai?propertiesPage=1&propertiesLimit=6"
```

## Content (Blogs / News)

### News List

```bash
curl -X GET "http://localhost:3333/real-estate-news"
```

### Blog List

```bash
curl -X GET "http://localhost:3333/blogs"
```

### Content Detail

```bash
curl -X GET "http://localhost:3333/some-content-slug"
```

## Forms

### Contact Form

```bash
curl -X POST http://localhost:3333/contact \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "phone": "+9710000000",
    "message": "I want more info",
    "pageUrl": "https://www.xrealty.ae",
    "ipAddress": "127.0.0.1"
  }'
```

Response:

```json
{ "message": "Form submitted successfully" }
```

### Brochure Download

```bash
curl -X POST http://localhost:3333/brochure-download \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "phone": "+9710000000",
    "projectBrochure": "DOC_ID",
    "projectName": "Project Name",
    "pageUrl": "https://www.xrealty.ae"
  }'
```

Response:

```json
{ "message": "Form submitted successfully", "brochureLink": "https://..." }
```

### Newsletter

```bash
curl -X POST http://localhost:3333/newsletter \
  -H "Content-Type: application/json" \
  -d '{ "email": "john@example.com", "pageName": "Home" }'
```

Response:

```json
{ "message": "Subscription successful" }
```

## Search

### Property Search

```bash
curl -X POST http://localhost:3333/property-search \
  -H "Content-Type: application/json" \
  -d '{
    "propertyType": "Apartment",
    "bedroom": "2 Bedroom",
    "priceRange": "1M - 2M",
    "community": "Downtown Dubai",
    "page": 1,
    "limit": 20
  }'
```

Response:

```json
{ "success": true, "data": { "properties": [], "totalPages": 0, "currentPage": 1 } }
```
