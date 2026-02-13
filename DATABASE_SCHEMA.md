# Database Schema - Form Builder

## Entity Relationship Diagram (ERD)

### ASCII Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         FORM BUILDER DATABASE                             │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────┐
│          USERS              │
├─────────────────────────────┤
│ • id: UUID (PK)             │
│ • email: VARCHAR (UQ)       │
│ • password: VARCHAR (HASH)  │
│ • name: VARCHAR             │
│ • role: ENUM                │ ─→ [ADMIN, USER]
│ • createdAt: TIMESTAMP      │
│ • updatedAt: TIMESTAMP      │
└──────────┬──────────────────┘
           │ 
           │ 1:N (creates)
           │
           ▼
┌──────────┴──────────────────┐                ┌─────────────────────────────┐
│         FORMS               │                │        QUESTIONS            │
├─────────────────────────────┤                ├─────────────────────────────┤
│ • id: UUID (PK)             │ 1            N │ • id: UUID (PK)             │
│ • title: VARCHAR            │◄───────────────┤ • formId: UUID (FK)         │
│ • description: TEXT         │   contains     │ • title: VARCHAR            │
│ • isPublished: BOOLEAN      │                │ • description: TEXT         │
│ • createdById: UUID (FK) ───┼────┐           │ • type: ENUM                │ ─→ [SHORT_TEXT, LONG_TEXT, 
│ • createdAt: TIMESTAMP      │    │           │ • isRequired: BOOLEAN       │     MULTIPLE_CHOICE, CHECKBOX]
│ • updatedAt: TIMESTAMP      │    │           │ • order: INT                │
└──────────┬──────────────────┘    │           │ • options: JSONB            │ ─→ ["opt1", "opt2", ...]
           │                       │           │ • createdAt: TIMESTAMP      │
           │ 1:N (receives)        │           │ • updatedAt: TIMESTAMP      │
           │                       │           └──────────┬──────────────────┘
           ▼                       │                      │
┌──────────┴──────────────────┐   │                      │ 1:N (has)
│       RESPONSES             │   │                      │
├─────────────────────────────┤   │                      ▼
│ • id: UUID (PK)             │   │           ┌──────────┴──────────────────┐
│ • formId: UUID (FK) ────────┼───┘           │         ANSWERS             │
│ • responderId: UUID (FK) ───┼───┐           ├─────────────────────────────┤
│ • createdAt: TIMESTAMP      │   │           │ • id: UUID (PK)             │
│ • updatedAt: TIMESTAMP      │   │         N │ • responseId: UUID (FK)     │
└──────────┬──────────────────┘   │      ┌────┤ • questionId: UUID (FK)     │
           │                       │      │    │ • value: JSONB              │ ─→ "text" or ["opt1", "opt2"]
           │ 1:N (contains)        │      │    │ • createdAt: TIMESTAMP      │
           └───────────────────────┼──────┘    └─────────────────────────────┘
                                   │                      ▲
                                   │                      │
                                   │                      │ N:1 (answers)
                                   └──────────────────────┘
```

## Table Details

### 1. USERS
**Purpose:** Menyimpan data user (admin dan responden)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email untuk login |
| password | VARCHAR(255) | NOT NULL | Hashed password (bcrypt) |
| name | VARCHAR(255) | NOT NULL | Full name |
| role | ENUM('ADMIN', 'USER') | DEFAULT 'USER' | User role |
| createdAt | TIMESTAMP | DEFAULT NOW() | Account creation time |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes:**
- PRIMARY: id
- UNIQUE: email

---

### 2. FORMS
**Purpose:** Menyimpan data form yang dibuat admin

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| title | VARCHAR(500) | NOT NULL | Form title |
| description | TEXT | NULL | Form description |
| isPublished | BOOLEAN | DEFAULT FALSE | Publication status |
| createdById | UUID | FOREIGN KEY (users.id) ON DELETE CASCADE | Form creator |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes:**
- PRIMARY: id
- INDEX: createdById, isPublished

**Relationships:**
- N:1 → Users (creator)
- 1:N → Questions
- 1:N → Responses

---

### 3. QUESTIONS
**Purpose:** Menyimpan pertanyaan dalam form

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| formId | UUID | FOREIGN KEY (forms.id) ON DELETE CASCADE | Parent form |
| title | VARCHAR(1000) | NOT NULL | Question text |
| description | TEXT | NULL | Additional description |
| type | ENUM | NOT NULL | Question type |
| isRequired | BOOLEAN | DEFAULT FALSE | Required flag |
| order | INTEGER | NOT NULL | Display order (0-based) |
| options | JSONB | NULL | Options for MULTIPLE_CHOICE/CHECKBOX |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update time |

**Question Types (ENUM):**
- `SHORT_TEXT` - Single line text input
- `LONG_TEXT` - Multi-line textarea
- `MULTIPLE_CHOICE` - Radio buttons (single selection)
- `CHECKBOX` - Checkboxes (multiple selection)

**Options Format (JSONB):**
```json
["Option 1", "Option 2", "Option 3"]
```

**Indexes:**
- PRIMARY: id
- INDEX: formId, order

**Relationships:**
- N:1 → Forms
- 1:N → Answers

---

### 4. RESPONSES
**Purpose:** Menyimpan submission form dari responden

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| formId | UUID | FOREIGN KEY (forms.id) ON DELETE CASCADE | Target form |
| responderId | UUID | FOREIGN KEY (users.id) ON DELETE SET NULL, NULL | Responder (nullable untuk anonymous) |
| createdAt | TIMESTAMP | DEFAULT NOW() | Submission time |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes:**
- PRIMARY: id
- INDEX: formId, responderId, createdAt

**Relationships:**
- N:1 → Forms
- N:1 → Users (optional - nullable)
- 1:N → Answers

---

### 5. ANSWERS
**Purpose:** Menyimpan jawaban individual per pertanyaan

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| responseId | UUID | FOREIGN KEY (responses.id) ON DELETE CASCADE | Parent response |
| questionId | UUID | FOREIGN KEY (questions.id) ON DELETE CASCADE | Target question |
| value | JSONB | NOT NULL | Answer value (flexible type) |
| createdAt | TIMESTAMP | DEFAULT NOW() | Answer submission time |

**Value Format (JSONB):**
- **SHORT_TEXT / LONG_TEXT / MULTIPLE_CHOICE:**
  ```json
  "User's text answer"
  ```

- **CHECKBOX:**
  ```json
  ["Selected Option 1", "Selected Option 2"]
  ```

**Constraints:**
- UNIQUE: (responseId, questionId) - One answer per question per response

**Indexes:**
- PRIMARY: id
- UNIQUE INDEX: (responseId, questionId)
- INDEX: questionId

**Relationships:**
- N:1 → Responses
- N:1 → Questions

---

## Relationships Overview

### Cascade Behaviors

1. **Delete User (ADMIN)**
   - CASCADE → Delete all Forms created by user
   - CASCADE → Delete all Questions in those forms
   - CASCADE → Delete all Responses to those forms
   - CASCADE → Delete all Answers to those responses

2. **Delete Form**
   - CASCADE → Delete all Questions
   - CASCADE → Delete all Responses
   - CASCADE → Delete all Answers

3. **Delete Question**
   - CASCADE → Delete all Answers to that question

4. **Delete Response**
   - CASCADE → Delete all Answers in that response

5. **Delete User (Responder)**
   - SET NULL → Responses become anonymous (responderId = NULL)

---

## Constraints & Validations

### Database Level
1. **Email uniqueness** dalam Users table
2. **One answer per question per response** via UNIQUE constraint
3. **Foreign key integrity** untuk semua relationships
4. **NOT NULL** untuk required fields

### Application Level (Backend)
1. Required questions validation sebelum submit
2. Question type validation (options required untuk MULTIPLE_CHOICE/CHECKBOX)
3. Published status check untuk public form access
4. Ownership verification untuk CRUD operations

---

## Indexes untuk Performance

### Frequently Queried
```sql
-- Forms
CREATE INDEX idx_forms_createdById ON forms(createdById);
CREATE INDEX idx_forms_published ON forms(isPublished);

-- Questions
CREATE INDEX idx_questions_formId_order ON questions(formId, "order");

-- Responses
CREATE INDEX idx_responses_formId ON responses(formId);
CREATE INDEX idx_responses_createdAt ON responses(createdAt DESC);

-- Answers
CREATE INDEX idx_answers_responseId ON answers(responseId);
CREATE INDEX idx_answers_questionId ON answers(questionId);
```

---

## Example Queries

### Get Form with Questions
```sql
SELECT f.*, 
       json_agg(q ORDER BY q.order) as questions
FROM forms f
LEFT JOIN questions q ON q."formId" = f.id
WHERE f.id = 'form-uuid'
GROUP BY f.id;
```

### Get All Responses for Form
```sql
SELECT r.*, 
       u.name as responder_name,
       json_agg(json_build_object(
         'questionId', a."questionId",
         'question', q.title,
         'answer', a.value
       )) as answers
FROM responses r
LEFT JOIN users u ON u.id = r."responderId"
JOIN answers a ON a."responseId" = r.id
JOIN questions q ON q.id = a."questionId"
WHERE r."formId" = 'form-uuid'
GROUP BY r.id, u.name
ORDER BY r."createdAt" DESC;
```

### Response Statistics
```sql
SELECT q.id, q.title, q.type,
       COUNT(a.id) as total_answers,
       jsonb_object_agg(a.value, cnt) as answer_distribution
FROM questions q
LEFT JOIN answers a ON a."questionId" = q.id
LEFT JOIN (
  SELECT "questionId", value, COUNT(*) as cnt
  FROM answers
  GROUP BY "questionId", value
) grouped ON grouped."questionId" = q.id
WHERE q."formId" = 'form-uuid'
GROUP BY q.id;
```

---

## Migration Commands

### Prisma Migration
```bash
# Create new migration
npx prisma migrate dev --name init

# Apply migrations
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset
```

### Raw SQL (if needed)
```sql
-- Create database
CREATE DATABASE formbuilder;

-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Then run Prisma migrations
```

---

## Data Types Mapping

| Prisma | PostgreSQL | TypeScript |
|--------|-----------|------------|
| String | VARCHAR/TEXT | string |
| Int | INTEGER | number |
| Boolean | BOOLEAN | boolean |
| DateTime | TIMESTAMP | Date |
| Json | JSONB | any / JsonValue |
| Enum | ENUM | union type |

---

**Schema Version:** 1.0  
**Last Updated:** February 2026  
**Compatible with:** PostgreSQL 14+, Prisma 5.x
