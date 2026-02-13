# Project Structure - Form Builder

## 📁 Complete Directory Tree

```
form_PHD_flora/
│
├── 📄 README.md                    # Main documentation
├── 📄 QUICK_START.md              # Quick setup guide
├── 📄 DATABASE_SCHEMA.md          # Database ERD & details
│
├── 📂 backend/                     # Node.js + Express Backend
│   ├── 📂 prisma/
│   │   └── schema.prisma          # Database schema (Prisma)
│   │
│   ├── 📂 src/
│   │   ├── 📂 middleware/
│   │   │   └── auth.middleware.ts # JWT authentication middleware
│   │   │
│   │   ├── 📂 routes/
│   │   │   ├── auth.routes.ts     # Auth endpoints (login/register)
│   │   │   ├── form.routes.ts     # Form CRUD endpoints
│   │   │   ├── question.routes.ts # Question CRUD endpoints
│   │   │   ├── response.routes.ts # Response submission endpoints
│   │   │   └── export.routes.ts   # Export Excel/PDF endpoints
│   │   │
│   │   └── server.ts              # Main Express app
│   │
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   ├── 📄 .env.example            # Environment template
│   ├── 📄 .gitignore
│   └── 📄 API_DOCS.md             # API documentation
│
└── 📂 frontend/                    # React + TypeScript Frontend
    ├── 📂 src/
    │   ├── 📂 components/
    │   │   └── 📂 layouts/
    │   │       └── MainLayout.tsx # Main layout with header
    │   │
    │   ├── 📂 pages/
    │   │   ├── Login.tsx          # Login page
    │   │   ├── Register.tsx       # Registration page
    │   │   ├── Dashboard.tsx      # Admin dashboard
    │   │   ├── FormBuilder.tsx    # Create/edit form
    │   │   ├── FormView.tsx       # Public form view
    │   │   └── FormResponses.tsx  # View responses
    │   │
    │   ├── 📂 services/
    │   │   └── api.ts             # API service layer (Axios)
    │   │
    │   ├── 📂 store/
    │   │   └── authStore.ts       # Auth state (Zustand)
    │   │
    │   ├── 📂 types/
    │   │   └── index.ts           # TypeScript interfaces
    │   │
    │   ├── App.tsx                # Main app with routes
    │   ├── main.tsx               # Entry point
    │   └── index.css              # Global styles (Tailwind)
    │
    ├── 📄 index.html
    ├── 📄 package.json
    ├── 📄 tsconfig.json
    ├── 📄 vite.config.ts           # Vite configuration
    ├── 📄 tailwind.config.js       # Tailwind CSS config
    ├── 📄 postcss.config.js        # PostCSS config
    ├── 📄 .env.example             # Environment template
    └── 📄 .gitignore
```

---

## 📋 File Descriptions

### Root Level

| File | Purpose |
|------|---------|
| `README.md` | Complete project documentation |
| `QUICK_START.md` | Quick setup guide (5 minutes) |
| `DATABASE_SCHEMA.md` | Database ERD, tables, relationships |
| `PROJECT_STRUCTURE.md` | This file - project organization |

---

### Backend Structure

#### `prisma/schema.prisma`
- Prisma ORM schema definition
- Defines all database tables (Users, Forms, Questions, Responses, Answers)
- Relationships dan constraints
- Auto-generates TypeScript types

#### `src/middleware/`
**auth.middleware.ts**
- JWT token verification
- Extracts user from token
- Checks admin permissions
- Protects private routes

#### `src/routes/`
**auth.routes.ts**
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

**form.routes.ts**
- `POST /api/forms` - Create form (admin)
- `GET /api/forms` - Get all forms (admin)
- `GET /api/forms/:id` - Get single form
- `PUT /api/forms/:id` - Update form (admin)
- `DELETE /api/forms/:id` - Delete form (admin)
- `PATCH /api/forms/:id/publish` - Publish/unpublish

**question.routes.ts**
- `POST /api/questions` - Create question (admin)
- `GET /api/questions/form/:formId` - Get questions
- `PUT /api/questions/:id` - Update question (admin)
- `DELETE /api/questions/:id` - Delete question (admin)
- `PATCH /api/questions/reorder` - Reorder questions

**response.routes.ts**
- `POST /api/responses` - Submit response (public)
- `GET /api/responses/form/:formId` - Get responses (admin)
- `GET /api/responses/:id` - Get single response (admin)
- `DELETE /api/responses/:id` - Delete response (admin)
- `GET /api/responses/form/:formId/stats` - Get statistics

**export.routes.ts**
- `GET /api/export/excel/:formId` - Export to Excel (admin)
- `GET /api/export/pdf/:formId` - Export to PDF (admin)

#### `src/server.ts`
- Express app initialization
- Middleware setup (CORS, JSON parsing)
- Route mounting
- Database connection
- Error handling
- Graceful shutdown

---

### Frontend Structure

#### `src/components/layouts/`
**MainLayout.tsx**
- Common layout for authenticated pages
- Header with logo dan logout button
- Navigation
- Wraps protected pages

#### `src/pages/`

**Login.tsx**
- Login form
- Email + password validation
- JWT token storage
- Redirect to dashboard

**Register.tsx**
- Registration form
- Name, email, password, confirm password
- Auto-login after registration

**Dashboard.tsx**
- List all forms created by user
- Show form stats (responses count)
- Actions: Edit, View Responses, Copy Link, Delete
- Publish/unpublish toggle

**FormBuilder.tsx**
- Create/edit form interface
- Add/remove/reorder questions
- Question types: Short Text, Long Text, Multiple Choice, Checkbox
- Options for multiple choice/checkbox
- Required toggle
- Save to backend

**FormView.tsx**
- Public form interface
- Display all questions
- Input fields based on question type
- Validation for required questions
- Submit answers
- Success confirmation

**FormResponses.tsx**
- Table view of all responses
- Columns: Timestamp, Responder, Answers
- Export buttons (Excel, PDF)
- Response statistics

#### `src/services/`
**api.ts**
- Centralized API calls
- Axios instance with interceptors
- Automatic token injection
- Error handling
- Type-safe API methods

#### `src/store/`
**authStore.ts**
- Zustand state management
- User authentication state
- Login/logout/register methods
- Token persistence in localStorage

#### `src/types/`
**index.ts**
- TypeScript interfaces
- User, Form, Question, Response, Answer types
- API response types
- Shared across components

#### Configuration Files

**vite.config.ts**
- Vite configuration
- Path aliases (@/)
- Proxy /api to backend

**tailwind.config.js**
- Tailwind CSS theme
- Custom colors (primary palette)
- Content paths

**postcss.config.js**
- PostCSS plugins
- Tailwind CSS processing
- Autoprefixer

---

## 🔄 Data Flow

### Creating a Form
```
User Action → FormBuilder.tsx → 
  apiService.createForm() → 
    POST /api/forms → 
      form.routes.ts → 
        Prisma → PostgreSQL

Response ← data ← JSON ← Express ← Prisma
```

### Submitting Response
```
User fills form → FormView.tsx → 
  apiService.submitResponse() → 
    POST /api/responses → 
      response.routes.ts → 
        Validate required fields → 
          Create Response + Answers → 
            Prisma → PostgreSQL
```

### Viewing Responses
```
Admin clicks "Responses" → FormResponses.tsx → 
  apiService.getResponses() → 
    GET /api/responses/form/:id → 
      response.routes.ts → 
        auth.middleware checks token → 
          Verify ownership → 
            Prisma query with joins → 
              PostgreSQL
```

---

## 🎨 Styling Architecture

### Tailwind CSS Utilities
- Used throughout all components
- Custom utility classes in `index.css`
- Responsive design dengan breakpoints:
  - `sm:` - 640px+
  - `md:` - 768px+
  - `lg:` - 1024px+

### Common Classes
```css
.btn - Base button styles
.btn-primary - Primary action button
.btn-secondary - Secondary button
.input - Form input styles
.card - Card container
```

### Color Palette
- Primary: Blue shades (primary-50 to primary-900)
- Success: Green (#10B981)
- Error: Red (#EF4444)
- Warning: Yellow (#F59E0B)

---

## 🔐 Authentication Flow

```
1. User registers/logs in
   ↓
2. Backend generates JWT token
   ↓
3. Frontend stores token in localStorage
   ↓
4. All API requests include: Authorization: Bearer <token>
   ↓
5. auth.middleware verifies token
   ↓
6. Request proceeds or returns 401
```

---

## 📦 Dependencies Overview

### Backend Key Dependencies
- `express` - Web framework
- `@prisma/client` - Database ORM
- `jsonwebtoken` - JWT auth
- `bcryptjs` - Password hashing
- `zod` - Validation
- `exceljs` - Excel export
- `pdfkit` - PDF export

### Frontend Key Dependencies
- `react` - UI library
- `react-router-dom` - Routing
- `@tanstack/react-query` - Data fetching
- `axios` - HTTP client
- `zustand` - State management
- `react-hook-form` - Form handling
- `tailwindcss` - Styling
- `lucide-react` - Icons

---

## 🧪 Testing Structure (Future)

```
backend/
├── __tests__/
│   ├── auth.test.ts
│   ├── forms.test.ts
│   └── responses.test.ts

frontend/
├── __tests__/
│   ├── Login.test.tsx
│   ├── Dashboard.test.tsx
│   └── FormBuilder.test.tsx
```

**Recommended testing libraries:**
- Backend: Jest, Supertest
- Frontend: Vitest, React Testing Library

---

## 🚀 Build Output

### Backend Build
```
backend/dist/
├── middleware/
│   └── auth.middleware.js
├── routes/
│   ├── auth.routes.js
│   ├── form.routes.js
│   └── ...
└── server.js
```

### Frontend Build
```
frontend/dist/
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── index.html
```

---

## 📊 Performance Considerations

### Backend
- Database indexes on foreign keys
- Prisma query optimization
- Connection pooling
- JWT stateless authentication

### Frontend
- Code splitting (React.lazy)
- React Query caching
- Optimistic updates
- Debounced searches

---

## 🔧 Extensibility Points

### Easy to Add:
1. **New Question Types** - Add enum to Prisma schema
2. **File Upload** - Add Multer middleware
3. **Email Notifications** - Add Nodemailer
4. **Analytics Dashboard** - Add Charts.js
5. **Form Templates** - Add templates table
6. **Conditional Logic** - Add rules to questions
7. **Themes** - Add theme switcher
8. **Multi-language** - Add i18n

---

## 📈 Scalability Notes

### Current Architecture Supports:
- ✅ Thousands of forms
- ✅ Millions of responses
- ✅ Concurrent users
- ✅ High read/write throughput

### Future Scaling Options:
- Redis caching for frequently accessed forms
- Read replicas for database
- CDN for frontend assets
- Microservices for export functionality
- Message queue for async operations

---

**Last Updated:** February 2026  
**Maintained by:** PHD Flora Team
