# Environment Variables (Sample)

This file is a sanitized example of `vars/.env`. Do not put real secrets here.

```env
PORT=3333
ENV=development

TEST_DB_URL=mongodb+srv://USER:PASSWORD@HOST/xrealty_website_dev_backend
DB_URL=mongodb+srv://USER:PASSWORD@HOST/xrealty_website_backend

SESSION_SECRET=REPLACE_ME
JWT_SECRET=REPLACE_ME

POSTMARK_TOKEN=POSTMARK_SERVER_TOKEN
POSTMARK_CONTACT_FORM_SERVER_TOKEN=POSTMARK_CONTACT_SERVER_TOKEN

CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET

FRONTEND_URL=http://localhost:5173

ZAPIER_URL=https://hooks.zapier.com/hooks/catch/XXXX/XXXX
CRM_URL=https://api.example.com/webhooks/createLead
N8N_FROM_SUBMIT_URL=https://n8n.example.com/webhook/XXXX
```
