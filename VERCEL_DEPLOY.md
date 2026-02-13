## 🚀 Quick Deploy ke Vercel

### 1️⃣ Install Vercel CLI
```bash
npm install -g vercel
```

### 2️⃣ Login
```bash
vercel login
```

### 3️⃣ Setup Database di Vercel
1. Buka https://vercel.com/dashboard
2. Klik **Storage** → **Create Database** → **Postgres**
3. Nama: `form-builder-db`
4. Region: **Singapore** (terdekat)
5. **Copy** semua environment variables yang muncul

### 4️⃣ Deploy
```bash
vercel
```
Ikuti prompts (tekan Enter untuk default)

### 5️⃣ Set Environment Variables

**Di terminal:**
```bash
vercel env add POSTGRES_URL
# Paste value dari Vercel Dashboard

vercel env add POSTGRES_PRISMA_URL
# Paste value dari Vercel Dashboard

vercel env add POSTGRES_URL_NON_POOLING
# Paste value dari Vercel Dashboard

vercel env add JWT_SECRET
# Ketik: your-super-secret-jwt-key-production-2026

vercel env add JWT_EXPIRES_IN
# Ketik: 7d
```

**Atau di Dashboard:**
- Vercel Dashboard → Project → Settings → Environment Variables
- Add semua variable di atas

### 6️⃣ Deploy Production
```bash
vercel --prod
```

### 7️⃣ Run Database Migration
```bash
# Set local .env dengan POSTGRES_PRISMA_URL dari Vercel
# Lalu run:
cd backend
npx prisma db push
```

### ✅ Done!
URL: `https://your-app.vercel.app`

---

## 🔄 Update & Redeploy

```bash
git add .
git commit -m "Update"
git push
vercel --prod
```

Atau enable **Auto-deploy from GitHub** di Vercel Dashboard!
