# 🚀 Quick Start Guide - Form Builder

Panduan cepat untuk menjalankan aplikasi Form Builder di lokal.

## ⚡ Quick Setup (5 Menit)

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Setup Database

Pastikan PostgreSQL sudah berjalan, lalu:

```bash
# Create database
createdb formbuilder

# Or via psql
psql -U postgres
CREATE DATABASE formbuilder;
\q
```

### 3. Configure Environment

**Backend (.env):**
```bash
cd backend
copy .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/formbuilder?schema=public"
PORT=5000
NODE_ENV=development
JWT_SECRET=change-this-to-random-secret-key-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env):**
```bash
cd frontend
copy .env.example .env
```

File `frontend/.env` sudah OK default:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Run Database Migrations

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Backend running di `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Frontend running di `http://localhost:5173`

### 6. Open Browser

Buka: **http://localhost:5173**

---

## 📝 First Time Usage

### 1. Register Admin Account
1. Klik "Create one" di halaman login
2. Isi:
   - Name: `Admin`
   - Email: `admin@example.com`
   - Password: `admin123`
3. Click "Create Account"

### 2. Create First Form
1. Click "Create New Form"
2. Isi form:
   - Title: `Customer Feedback`
   - Description: `We value your feedback`
3. Add questions:
   - Click "Add Question"
   - Question 1:
     - Title: `What is your name?`
     - Type: `Short Text`
     - Check "Required"
   - Question 2:
     - Title: `How satisfied are you?`
     - Type: `Multiple Choice`
     - Options: `Very Satisfied, Satisfied, Neutral, Dissatisfied`
     - Check "Required"
4. Click "Save Form"

### 3. Publish Form
1. Kembali ke Dashboard
2. Click icon mata (eye) pada form untuk publish
3. Click icon copy untuk copy link form
4. Share link ke responden!

### 4. View Responses
1. Buka link form di incognito/browser lain
2. Isi form dan submit
3. Kembali ke dashboard
4. Click "Responses" button
5. See all submitted data!
6. Export to Excel or PDF

---

## 🔧 Common Issues & Solutions

### Issue 1: Database Connection Failed
**Error:** `Error: P1001: Can't reach database server`

**Solution:**
```bash
# Check if PostgreSQL is running
# Windows:
services.msc  # Look for "postgresql"

# Or start PostgreSQL:
pg_ctl -D "C:\Program Files\PostgreSQL\16\data" start

# Verify connection:
psql -U postgres -c "SELECT version();"
```

### Issue 2: Port Already in Use
**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Windows - Kill process on port 5000:
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Or change PORT in backend/.env to 5001
```

### Issue 3: Prisma Client Not Generated
**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
cd backend
npm run prisma:generate
```

### Issue 4: CORS Error
**Symptom:** Frontend can't connect to backend

**Solution:**
Pastikan di `backend/.env`:
```env
FRONTEND_URL=http://localhost:5173
```

Dan restart backend server.

### Issue 5: npm install fails
**Error:** Various npm errors

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

## 🎯 Testing API with cURL

### Register:
```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\",\"name\":\"Test User\",\"role\":\"ADMIN\"}"
```

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}"
```

### Create Form (replace TOKEN):
```bash
curl -X POST http://localhost:5000/api/forms ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{\"title\":\"Test Form\",\"description\":\"Testing\"}"
```

---

## 📱 Chrome Extensions (Recommended)

1. **JSON Viewer** - Format JSON responses
2. **React Developer Tools** - Debug React components
3. **Redux DevTools** - Debug state (if using Redux)

---

## 🗃️ Database Tools

### Prisma Studio (Recommended)
```bash
cd backend
npm run prisma:studio
```
Opens GUI at `http://localhost:5555`

### pgAdmin 4
Download: https://www.pgadmin.org/

### DBeaver
Download: https://dbeaver.io/

---

## 🔐 Security Notes (Development)

⚠️ **NEVER use these in production:**
- Default JWT_SECRET
- Weak passwords
- Exposed .env files

✅ **For production:**
- Use strong random JWT_SECRET (32+ chars)
- Enable HTTPS
- Set secure password policies
- Use environment variables properly
- Enable rate limiting
- Add CSRF protection

---

## 📚 Useful Commands

### Backend
```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Prisma Studio (DB GUI)
npm run prisma:studio

# Reset database (CAUTION: deletes all data)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name your_migration_name
```

### Frontend
```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Type check
npx tsc --noEmit
```

---

## 🎓 Next Steps

1. ✅ Complete Quick Start
2. 📖 Read [README.md](./README.md) untuk detail lengkap
3. 🔌 Check [API_DOCS.md](./backend/API_DOCS.md) untuk API reference
4. 🗄️ Check [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) untuk schema details
5. 🎨 Customize Tailwind theme di `frontend/tailwind.config.js`
6. 🔧 Add new features!

---

## 💡 Tips & Tricks

### Hot Reload
- Backend: Otomatis reload dengan `tsx watch`
- Frontend: Otomatis reload dengan Vite HMR

### Debugging
```typescript
// Backend debugging
console.log('Debug:', { data });

// Frontend debugging
console.log('Component rendered:', props);

// React Query DevTools (add to App.tsx)
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
<ReactQueryDevtools initialIsOpen={false} />
```

### Code Format (Optional)
```bash
# Install Prettier
npm install -D prettier

# Create .prettierrc
echo "{ \"semi\": false, \"singleQuote\": true }" > .prettierrc

# Format code
npx prettier --write "src/**/*.{ts,tsx}"
```

---

## 🤝 Getting Help

- 📧 Email: support@example.com
- 💬 GitHub Issues: [Create Issue](https://github.com/yourrepo/issues)
- 📖 Documentation: See README.md
- 🔍 Stack Overflow: Tag `form-builder`

---

**Happy Coding! 🎉**

Made with ❤️ for developers
