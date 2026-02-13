# 📝 Form Builder - Google Form Clone

Sistem pembuatan form online yang mirip dengan Google Forms, dibangun dengan React, Node.js, Express, dan PostgreSQL.

## ✨ Fitur Utama

### 👨‍💼 Untuk Admin
- ✅ Membuat form baru dengan judul dan deskripsi
- ✅ Menambah, mengedit, dan menghapus pertanyaan
- ✅ 4 tipe pertanyaan: Short Text, Long Text, Multiple Choice, Checkbox
- ✅ Menandai pertanyaan sebagai wajib atau opsional
- ✅ Publish/unpublish form
- ✅ Dashboard untuk melihat semua form
- ✅ Melihat semua respons dalam tabel
- ✅ Export respons ke Excel atau PDF
- ✅ Copy link form untuk dibagikan

### 👥 Untuk User/Responden
- ✅ Mengisi form melalui link publik
- ✅ Validasi pertanyaan wajib
- ✅ Submit jawaban ke database
- ✅ Konfirmasi setelah submit

## 🏗️ Tech Stack

### Frontend
- **React 18** - Library UI
- **TypeScript** - Type safety
- **Vite** - Build tool yang cepat
- **Tailwind CSS** - Styling modern
- **React Query** - Data fetching & caching
- **React Hook Form** - Form management
- **Zustand** - State management
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **date-fns** - Date formatting

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma ORM** - Database ORM modern
- **PostgreSQL** - Relational database
- **JWT** - Authentication
- **Zod** - Schema validation
- **bcryptjs** - Password hashing
- **ExcelJS** - Export to Excel
- **PDFKit** - Export to PDF

## 📊 Database Schema (ERD)

```
┌─────────────────┐
│     Users       │
├─────────────────┤
│ id (PK)         │
│ email (unique)  │
│ password        │
│ name            │
│ role (enum)     │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │ 1
         │
         │ N
┌────────┴────────┐         ┌─────────────────┐
│     Forms       │ 1     N │   Questions     │
├─────────────────┤─────────├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ title           │         │ formId (FK)     │
│ description     │         │ title           │
│ isPublished     │         │ description     │
│ createdById(FK) │         │ type (enum)     │
│ createdAt       │         │ isRequired      │
│ updatedAt       │         │ order           │
└────────┬────────┘         │ options (json)  │
         │ 1                │ createdAt       │
         │                  │ updatedAt       │
         │ N                └────────┬────────┘
         │                           │ 1
         │                           │
┌────────┴────────┐                  │ N
│   Responses     │         ┌────────┴────────┐
├─────────────────┤         │    Answers      │
│ id (PK)         │ 1     N ├─────────────────┤
│ formId (FK)     │─────────│ id (PK)         │
│ responderId(FK?)│         │ responseId (FK) │
│ createdAt       │         │ questionId (FK) │
│ updatedAt       │         │ value (json)    │
└─────────────────┘         │ createdAt       │
                            └─────────────────┘

Enums:
• UserRole: ADMIN, USER
• QuestionType: SHORT_TEXT, LONG_TEXT, MULTIPLE_CHOICE, CHECKBOX
```

## 🚀 Cara Install & Menjalankan

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm atau yarn

### 1. Clone & Setup

```bash
cd form_PHD_flora
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Edit .env file dan sesuaikan DATABASE_URL Anda
# DATABASE_URL="postgresql://user:password@localhost:5432/formbuilder?schema=public"

# Generate Prisma Client
npm run prisma:generate

# Run migrations (create tables)
npm run prisma:migrate

# (Optional) Open Prisma Studio to see database
npm run prisma:studio

# Start backend server
npm run dev
```

Backend akan berjalan di `http://localhost:5000`

### 3. Setup Frontend

Buka terminal baru:

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Start frontend development server
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register   - Register user baru
POST   /api/auth/login      - Login user
GET    /api/auth/me         - Get current user
```

### Forms (Protected - Admin only)
```
POST   /api/forms           - Create form baru
GET    /api/forms           - Get semua form milik user
GET    /api/forms/:id       - Get single form (public jika published)
PUT    /api/forms/:id       - Update form
DELETE /api/forms/:id       - Delete form
PATCH  /api/forms/:id/publish - Publish/unpublish form
```

### Questions (Protected - Admin only)
```
POST   /api/questions       - Create pertanyaan
GET    /api/questions/form/:formId - Get semua pertanyaan dari form
PUT    /api/questions/:id   - Update pertanyaan
DELETE /api/questions/:id   - Delete pertanyaan
PATCH  /api/questions/reorder - Reorder pertanyaan
```

### Responses
```
POST   /api/responses       - Submit response (public untuk published forms)
GET    /api/responses/form/:formId - Get semua response (Admin only)
GET    /api/responses/:id   - Get single response (Admin only)
DELETE /api/responses/:id   - Delete response (Admin only)
GET    /api/responses/form/:formId/stats - Get statistics (Admin only)
```

### Export (Protected - Admin only)
```
GET    /api/export/excel/:formId - Export responses ke Excel
GET    /api/export/pdf/:formId   - Export responses ke PDF
```

## 🎯 Cara Menggunakan

### Sebagai Admin

1. **Register/Login**
   - Buka `http://localhost:5173/register`
   - Daftar dengan email, nama, dan password
   - Otomatis login setelah register

2. **Membuat Form**
   - Klik tombol "Create New Form" di dashboard
   - Isi judul dan deskripsi form
   - Tambahkan pertanyaan dengan klik "Add Question"
   - Pilih tipe pertanyaan (Short Text, Long Text, Multiple Choice, Checkbox)
   - Centang "Required" jika pertanyaan wajib diisi
   - Untuk Multiple Choice/Checkbox, masukkan opsi dipisah dengan koma
   - Klik "Save Form"

3. **Publish Form**
   - Di dashboard, klik icon mata pada form
   - Form yang published bisa diakses oleh siapa saja
   - Form draft hanya bisa dilihat oleh pembuat

4. **Share Form**
   - Klik icon copy untuk menyalin link form
   - Bagikan link ke responden

5. **Lihat Responses**
   - Klik tombol "Responses" pada form di dashboard
   - Lihat semua jawaban dalam bentuk tabel
   - Export ke Excel atau PDF untuk analisis lebih lanjut

### Sebagai User/Responden

1. Buka link form yang dibagikan (contoh: `http://localhost:5173/form/abc123`)
2. Isi semua pertanyaan (pertanyaan dengan tanda * wajib diisi)
3. Klik "Submit"
4. Akan muncul konfirmasi sukses

## 🔒 Security Features

- ✅ Password di-hash dengan bcryptjs
- ✅ JWT authentication untuk protected routes
- ✅ Input validation dengan Zod
- ✅ CORS protection
- ✅ SQL injection protection (Prisma ORM)
- ✅ Authorization checks (Admin vs User)

## 📁 Struktur Project

```
form_PHD_flora/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # Database schema
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── form.routes.ts
│   │   │   ├── question.routes.ts
│   │   │   ├── response.routes.ts
│   │   │   └── export.routes.ts
│   │   └── server.ts             # Main server file
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── layouts/
    │   │       └── MainLayout.tsx
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Register.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── FormBuilder.tsx
    │   │   ├── FormView.tsx
    │   │   └── FormResponses.tsx
    │   ├── services/
    │   │   └── api.ts
    │   ├── store/
    │   │   └── authStore.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── .env
```

## 🎨 Screenshots

### Dashboard
![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Admin)
- Melihat semua form yang telah dibuat
- Status published/draft
- Jumlah responses
- Actions: Edit, View Responses, Copy Link, Delete

### Form Builder
![Form Builder](https://via.placeholder.com/800x400?text=Form+Builder)
- Drag & drop questions
- Multiple question types
- Required/optional toggle
- Live preview

### Form View (Public)
![Form View](https://via.placeholder.com/800x400?text=Public+Form+View)
- Clean interface untuk responden
- Validation untuk required fields
- Success confirmation

### Responses Table
![Responses](https://via.placeholder.com/800x400?text=Responses+Table)
- Tabel lengkap semua respons
- Export ke Excel/PDF
- Filter dan search

## 🔧 Development

### Database Commands

```bash
# Generate Prisma Client after schema changes
npm run prisma:generate

# Create new migration
npm run prisma:migrate

# Reset database (CAUTION: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (GUI for database)
npm run prisma:studio
```

### Build for Production

Backend:
```bash
cd backend
npm run build
npm start
```

Frontend:
```bash
cd frontend
npm run build
# Files akan ada di folder dist/
```

## 🚀 Deployment Tips

### Backend
- Deploy ke Railway, Render, atau Heroku
- Set environment variables di platform deployment
- Jalankan Prisma migrations di production
- Gunakan PostgreSQL production database

### Frontend
- Deploy ke Vercel, Netlify, atau Cloudflare Pages
- Update `VITE_API_URL` ke URL backend production
- Build otomatis dari Git repository

## 🤝 Contributing

Contributions are welcome! Silakan:
1. Fork repository ini
2. Buat branch baru (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📝 License

MIT License - Feel free to use this project for learning or commercial purposes.

## 👨‍💻 Author

Built with ❤️ by PHD Flora Team

## 🙏 Acknowledgments

- Inspired by Google Forms
- Icons by Lucide React
- UI components dengan Tailwind CSS

---

**Happy Form Building! 🎉**
