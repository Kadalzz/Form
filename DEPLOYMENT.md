# Form Builder - Deployment Guide

## 🚀 Deploy ke Vercel

### Prerequisites:
1. Account Vercel (gratis): https://vercel.com
2. Vercel CLI: `npm i -g vercel`
3. Repository sudah di GitHub

---

## 📋 Langkah Deployment:

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login ke Vercel
```bash
vercel login
```

### 3. Setup Vercel Postgres Database

**Di Vercel Dashboard:**
1. Buka: https://vercel.com/dashboard
2. Klik "Storage" tab
3. Klik "Create Database"
4. Pilih "Postgres"
5. Database name: `form-builder-db`
6. Region: Pilih terdekat (Singapore)
7. Klik "Create"

**Copy Environment Variables:**
Setelah database dibuat, akan muncul environment variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

### 4. Deploy Project

```bash
vercel
```

**Ikuti prompts:**
- Set up and deploy? **Y**
- Which scope? Pilih account Anda
- Link to existing project? **N**
- What's your project's name? `form-builder`
- In which directory is your code located? `.`
- Want to override settings? **N**

### 5. Set Environment Variables

```bash
# Set database URLs
vercel env add POSTGRES_URL
vercel env add POSTGRES_PRISMA_URL
vercel env add POSTGRES_URL_NON_POOLING

# Set JWT secret
vercel env add JWT_SECRET
# Value: your-super-secret-jwt-key-production

# Set JWT expiry
vercel env add JWT_EXPIRES_IN
# Value: 7d

# Set Node environment
vercel env add NODE_ENV
# Value: production
```

Atau set di Vercel Dashboard → Settings → Environment Variables

### 6. Run Database Migration

```bash
# Local: generate Prisma client
npm run prisma:generate

# Deploy dengan migration
vercel --prod
```

### 7. Push Migration ke Production Database

Setelah deploy, jalankan migration:

```bash
# Set connection string di local .env
# Copy POSTGRES_PRISMA_URL dari Vercel

# Run migration
npx prisma db push
```

---

## 🌐 Access Your App

Setelah deploy sukses:
- **Production URL:** `https://form-builder-xxx.vercel.app`
- **API:** `https://form-builder-xxx.vercel.app/api`

---

## 🔧 Configuration Files

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    }
  ]
}
```

### Environment Variables Needed:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `NODE_ENV`

---

## 📝 Update & Redeploy

Setiap kali ada perubahan:

```bash
# Commit changes
git add .
git commit -m "Update features"
git push

# Deploy
vercel --prod
```

Atau setup **Auto-deploy from GitHub** di Vercel Dashboard.

---

## 🐛 Troubleshooting

### Database Connection Error
- Pastikan environment variables sudah di-set
- Regenerate Prisma Client: `npm run prisma:generate`

### Build Error
- Check logs di Vercel Dashboard
- Pastikan semua dependencies di package.json

### API Not Working
- Check `/api` route di browser
- Verify API routes di vercel.json

---

## 📊 Monitoring

Di Vercel Dashboard bisa monitor:
- Deployments
- Analytics
- Logs
- Performance

---

**Deployment ready! 🎉**
