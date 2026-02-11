# System Flows (Sequence Diagrams)

Below are high-level sequence diagrams for core flows.

## 1. Admin Login + Session

```mermaid
sequenceDiagram
    participant Admin
    participant Backend
    participant MongoDB

    Admin->>Backend: POST /admin/login (username, password)
    Backend->>MongoDB: User.authenticate()
    MongoDB-->>Backend: User document + password match
    Backend->>MongoDB: Create session in connect-mongo
    Backend-->>Admin: 200 { success: true }
    Admin->>Backend: Subsequent requests w/ session cookie
    Backend->>MongoDB: Session lookup
    Backend-->>Admin: Authorized response
```

## 2. Contact Form Submission

```mermaid
sequenceDiagram
    participant User
    participant Backend
    participant MongoDB
    participant Postmark
    participant N8N
    participant Zapier

    User->>Backend: POST /contact
    Backend->>Backend: Joi validation
    Backend->>MongoDB: Save Contact
    Backend->>Postmark: Send lead email
    Backend->>N8N: POST webhook
    Backend-->>User: 201 Form submitted
    Backend->>Zapier: POST webhook (finally)
```

## 3. Property Search

```mermaid
sequenceDiagram
    participant User
    participant Backend
    participant MongoDB

    User->>Backend: POST /property-search
    Backend->>Backend: Parse filters (type, bedroom, price)
    Backend->>MongoDB: Aggregation pipeline
    MongoDB-->>Backend: Matching properties + count
    Backend-->>User: 200 { properties, totalPages }
```

## 4. Password Reset

```mermaid
sequenceDiagram
    participant User
    participant Backend
    participant MongoDB
    participant Postmark
    participant Frontend

    User->>Backend: POST /admin/resetPassword (email)
    Backend->>MongoDB: Find user
    Backend->>MongoDB: Create ResetToken
    Backend->>Postmark: Send reset email
    Postmark-->>User: Email with reset link
    User->>Backend: GET /admin/verifyResetToken/:token
    Backend->>MongoDB: Validate token
    Backend-->>Frontend: Redirect to /reset-password
    User->>Backend: POST /admin/resetPassword (token, new password)
    Backend->>MongoDB: Update password + delete token
    Backend-->>User: 200 success
```
