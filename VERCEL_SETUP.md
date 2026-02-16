# Vercel Database Setup - PENTING!

## ⚠️ Error: Environment variable not found: DATABASE_URL

Jika Anda melihat error ini saat deployment, berarti database belum dikonfigurasi di Vercel.

## 🔧 Cara Setup Database di Vercel:

### Opsi 1: Link Vercel Postgres Database (Recommended)

1. **Buka Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Pilih project Anda: `form-theta-virid`

2. **Buka tab Storage:**
   - Klik tab "Storage" di menu atas

3. **Buat Database:**
   - Klik tombol "Create Database"
   - Pilih "Postgres"
   - Database name: `form-builder-db`
   - Region: Pilih "Singapore" atau terdekat
   - Klik "Create"

4. **Connect ke Project:**
   - Setelah database dibuat, klik tombol "Connect Project"
   - Pilih project `form-theta-virid`
   - Klik "Connect"
   
   ✅ Environment variables akan otomatis ditambahkan:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL` 
   - `POSTGRES_URL_NON_POOLING`
   - Dan lain-lain

5. **Tambahkan Environment Variables Lain:**
   - Masih di tab Settings → Environment Variables
   - Tambahkan:
     ```
     DATABASE_URL = ${POSTGRES_PRISMA_URL}
     JWT_SECRET = your-super-secret-jwt-key-12345
     JWT_EXPIRES_IN = 7d
     NODE_ENV = production
     ```

6. **Redeploy Project:**
   - Klik tab "Deployments"
   - Klik tombol "..." pada deployment terbaru
   - Pilih "Redeploy"
   - ✅ Deployment akan sukses!

### Opsi 2: Gunakan Database Eksternal

Jika Anda sudah punya PostgreSQL database (Neon, Supabase, Railway, dll):

1. **Buka Vercel Dashboard → Settings → Environment Variables**
2. **Tambahkan:**
   ```
   DATABASE_URL = postgresql://user:password@host:port/database
   JWT_SECRET = your-super-secret-jwt-key-12345
   JWT_EXPIRES_IN = 7d
   NODE_ENV = production
   ```
3. **Redeploy project**

---

## 🎯 Verifikasi Setup Berhasil:

Setelah setup, Anda harus bisa:
- ✅ Form dapat disubmit tanpa error
- ✅ Response tersimpan di database
- ✅ Data muncul di dashboard

## 🆘 Troubleshooting:

### Error: "Prisma schema validation error"
- Pastikan environment variable `DATABASE_URL` sudah di-set
- Cek di Vercel Dashboard → Settings → Environment Variables

### Error: "responderName does not exist"
- Database migration belum jalan
- Setelah set env variables, redeploy project
- Migration akan otomatis berjalan saat deployment

### Masih Error?
- Check Vercel deployment logs
- Pastikan semua env variables sudah terset dengan benar
- Coba redeploy ulang

---

**Note:** Vercel Postgres memiliki free tier dengan limit:
- 256 MB storage
- 60 hours compute time per month
- Cukup untuk development dan small applications
