# Backend API Documentation

## Overview
RESTful API untuk Form Builder application menggunakan Express.js + TypeScript + Prisma + PostgreSQL.

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication
Gunakan JWT Bearer token di header:
```
Authorization: Bearer <your_jwt_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": true,
  "message": "Error description",
  "details": [ ... ] // Optional untuk validation errors
}
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "ADMIN" // Optional: ADMIN atau USER (default: USER)
}
```

**Response:** Returns user object & JWT token

---

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "ADMIN"
    },
    "token": "jwt_token_here"
  }
}
```

---

### Get Current User
```http
GET /api/auth/me
```

**Headers:** Requires `Authorization: Bearer <token>`

---

## 📋 Forms Endpoints

### Create Form
```http
POST /api/forms
```

**Headers:** Requires Authentication (Admin)

**Request Body:**
```json
{
  "title": "Customer Satisfaction Survey",
  "description": "Please share your feedback",
  "isPublished": false
}
```

---

### Get All Forms
```http
GET /api/forms
```

**Headers:** Requires Authentication (Admin)

**Response:** Array of forms with questions count

---

### Get Single Form
```http
GET /api/forms/:id
```

- Public jika form `isPublished: true`
- Private (Admin only) jika form `isPublished: false`

---

### Update Form
```http
PUT /api/forms/:id
```

**Headers:** Requires Authentication (Admin & Owner)

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "isPublished": true
}
```

---

### Delete Form
```http
DELETE /api/forms/:id
```

**Headers:** Requires Authentication (Admin & Owner)

---

### Publish/Unpublish Form
```http
PATCH /api/forms/:id/publish
```

**Headers:** Requires Authentication (Admin & Owner)

**Request Body:**
```json
{
  "isPublished": true
}
```

---

## ❓ Questions Endpoints

### Create Question
```http
POST /api/questions
```

**Headers:** Requires Authentication (Admin)

**Request Body:**
```json
{
  "formId": "form-uuid",
  "title": "What is your favorite color?",
  "description": "Choose one option",
  "type": "MULTIPLE_CHOICE",
  "isRequired": true,
  "order": 0,
  "options": ["Red", "Blue", "Green", "Yellow"]
}
```

**Question Types:**
- `SHORT_TEXT` - Input text pendek
- `LONG_TEXT` - Textarea panjang
- `MULTIPLE_CHOICE` - Radio buttons (options required)
- `CHECKBOX` - Multiple selection (options required)

---

### Get Questions by Form
```http
GET /api/questions/form/:formId
```

Returns questions ordered by `order` field.

---

### Update Question
```http
PUT /api/questions/:id
```

**Headers:** Requires Authentication (Admin & Form Owner)

---

### Delete Question
```http
DELETE /api/questions/:id
```

**Headers:** Requires Authentication (Admin & Form Owner)

---

### Reorder Questions
```http
PATCH /api/questions/reorder
```

**Headers:** Requires Authentication (Admin)

**Request Body:**
```json
{
  "questions": [
    { "id": "question-1-uuid", "order": 0 },
    { "id": "question-2-uuid", "order": 1 },
    { "id": "question-3-uuid", "order": 2 }
  ]
}
```

---

## 📨 Responses Endpoints

### Submit Response
```http
POST /api/responses
```

**Public endpoint** (untuk published forms)

**Request Body:**
```json
{
  "formId": "form-uuid",
  "answers": [
    {
      "questionId": "question-uuid",
      "value": "My answer here"
    },
    {
      "questionId": "checkbox-question-uuid",
      "value": ["Option 1", "Option 2"]
    }
  ]
}
```

**Value types:**
- String untuk SHORT_TEXT, LONG_TEXT, MULTIPLE_CHOICE
- Array of strings untuk CHECKBOX

---

### Get Form Responses
```http
GET /api/responses/form/:formId
```

**Headers:** Requires Authentication (Admin & Form Owner)

**Response:** Array of responses dengan semua answers

---

### Get Single Response
```http
GET /api/responses/:id
```

**Headers:** Requires Authentication (Admin & Form Owner)

---

### Delete Response
```http
DELETE /api/responses/:id
```

**Headers:** Requires Authentication (Admin & Form Owner)

---

### Get Response Statistics
```http
GET /api/responses/form/:formId/stats
```

**Headers:** Requires Authentication (Admin & Form Owner)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalResponses": 150,
    "questionStats": [
      {
        "questionId": "uuid",
        "questionTitle": "What is your age?",
        "questionType": "MULTIPLE_CHOICE",
        "totalAnswers": 150,
        "answers": {
          "18-25": 45,
          "26-35": 60,
          "36-45": 30,
          "45+": 15
        }
      }
    ]
  }
}
```

---

## 📥 Export Endpoints

### Export to Excel
```http
GET /api/export/excel/:formId
```

**Headers:** Requires Authentication (Admin & Form Owner)

**Response:** Excel file (XLSX)

---

### Export to PDF
```http
GET /api/export/pdf/:formId
```

**Headers:** Requires Authentication (Admin & Form Owner)

**Response:** PDF file

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no token or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Rate Limiting
- Belum diimplementasikan (TODO untuk production)
- Rekomendasi: 100 requests per 15 minutes per IP

---

## Validation Rules

### Email
- Must be valid email format
- Unique in database

### Password
- Minimum 6 characters
- No maximum limit

### Form Title
- Required
- Minimum 1 character

### Question Title
- Required
- Minimum 1 character

### Options (for MULTIPLE_CHOICE & CHECKBOX)
- Array of strings
- At least 1 option required

---

## Testing

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User","role":"ADMIN"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**Create Form (dengan token):**
```bash
curl -X POST http://localhost:5000/api/forms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title":"My Survey","description":"Test survey"}'
```

### Using Postman
1. Import collection dari `postman_collection.json` (jika tersedia)
2. Set environment variable `API_URL` = `http://localhost:5000/api`
3. Set `token` variable setelah login

---

## Database Schema

See [README.md](../README.md) for complete ERD diagram.

### Key Relationships:
- User → Forms (1:N) - User bisa punya banyak forms
- Form → Questions (1:N) - Form punya banyak questions
- Form → Responses (1:N) - Form bisa punya banyak responses
- Question → Answers (1:N) - Question bisa punya banyak answers
- Response → Answers (1:N) - Response punya banyak answers
- User → Responses (1:N) - User bisa submit banyak responses

### Cascade Deletes:
- Delete Form → deletes Questions, Responses, Answers
- Delete Question → deletes Answers
- Delete Response → deletes Answers
- Delete User → deletes Forms (and cascade)

---

## Environment Variables

Required in `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/formbuilder"
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

---

## Best Practices

1. **Always validate input** - Gunakan Zod schemas
2. **Check authorization** - Verify user owns resource
3. **Handle errors** - Use try-catch dan proper error messages
4. **Use transactions** - Untuk operations yang multi-step
5. **Sanitize output** - Never return sensitive data (password, etc)

---

**Last Updated:** February 2026
