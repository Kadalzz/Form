// Script untuk membuat Kuesioner Eksploratori PHD untuk FloraSamosir (Bahasa Indonesia)
const BASE = 'https://form-theta-virid.vercel.app/api'

async function main() {
  // Login sebagai FloraSamosir
  console.log('Masuk sebagai FloraSamosir...')
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gebychristy@gmail.com', password: '12Mei2002' })
  })
  const loginData = await loginRes.json()
  if (!loginData.success) {
    console.error('Login gagal:', loginData)
    return
  }
  const token = loginData.data.token
  console.log('Login berhasil! Token:', token.substring(0, 20) + '...')

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  // Buat form dengan tema akademik
  console.log('Membuat form...')
  const formRes = await fetch(`${BASE}/forms`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'KUESIONER EKSPLORATORI PHD',
      description: 'Universitas Sunderland UK, Fakultas Bisnis & Teknologi\n10 Februari 2026',
      themeColor: '#7B1F3A',
      headerImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=300&fit=crop',
      logoUrl: '',
    })
  })
  const formData = await formRes.json()
  if (!formData.success) {
    console.error('Pembuatan form gagal:', formData)
    return
  }
  const formId = formData.data.id
  console.log('Form berhasil dibuat! ID:', formId)

  // Definisi semua pertanyaan dalam Bahasa Indonesia
  const questions = [
    // Header Bagian A
    {
      formId, title: 'Bagian A: Karakteristik Demografis Responden',
      type: 'SECTION_HEADER', isRequired: false, order: 0, options: []
    },
    // P1 - Usia
    {
      formId, title: '1. Usia',
      type: 'MULTIPLE_CHOICE', isRequired: false, order: 1,
      options: ['Di bawah 30 tahun', '30-34 tahun', '35-44 tahun', '45-54 tahun', '55-60 tahun', 'Di atas 60 tahun']
    },
    // P2 - Jenis Kelamin
    {
      formId, title: '2. Jenis Kelamin',
      type: 'MULTIPLE_CHOICE', isRequired: false, order: 2,
      options: ['Perempuan', 'Laki-laki', 'Tidak Berlaku']
    },
    // P4 - Pengalaman
    {
      formId, title: '4. Pengalaman',
      type: 'MULTIPLE_CHOICE', isRequired: false, order: 3,
      options: ['Di bawah 5 tahun', '6-10 tahun', 'Di atas 10 tahun']
    },
    // P5 - Suku/Etnis
    {
      formId, title: '5. Suku/Etnis',
      type: 'MULTIPLE_CHOICE', isRequired: false, order: 4,
      options: ['Jawa', 'Tionghoa', 'Minoritas']
    },
    // P6 - Agama (wajib)
    {
      formId, title: '6. Agama',
      type: 'MULTIPLE_CHOICE', isRequired: true, order: 5,
      options: ['Islam', 'Kristen', 'Buddha', 'Hindu', 'Lainnya']
    },
    // P7 - Pendidikan/Kualifikasi
    {
      formId, title: '7. Pendidikan/Kualifikasi',
      type: 'MULTIPLE_CHOICE', isRequired: false, order: 6,
      options: ['Doktor', 'Pascasarjana', 'Sarjana', 'Menengah', 'Lainnya']
    },
    // P8 - Status Pernikahan
    {
      formId, title: '8. Status Pernikahan',
      type: 'MULTIPLE_CHOICE', isRequired: false, order: 7,
      options: ['Menikah', 'Lajang', 'Lainnya']
    },
    // P9 - Afiliasi Politik
    {
      formId,
      title: '9. Afiliasi Politik',
      description: 'PDI-P: Partai Demokrasi Indonesia Perjuangan. Golkar: Partai Golongan Karya. Gerindra: Partai Gerakan Indonesia Raya.',
      type: 'MULTIPLE_CHOICE', isRequired: false, order: 8,
      options: ['PDI-P', 'Golkar', 'Gerindra', 'Lainnya']
    },

    // Header Bagian B
    {
      formId, title: 'Bagian B: Tema Utama',
      description: 'Bagian B1: Bisnis Milik Keluarga dan Bisnis Terkait di Indonesia.',
      type: 'SECTION_HEADER', isRequired: false, order: 9, options: []
    },
    // P10
    {
      formId,
      title: '10. Menurut Anda, sejauh mana Anda setuju atau tidak setuju bahwa bisnis milik keluarga terus berkontribusi terhadap produk domestik bruto Indonesia?',
      type: 'LINEAR_SCALE', isRequired: true, order: 10,
      options: ['1', '7', 'Sangat Tidak Setuju', 'Sangat Setuju']
    },
    // P11
    {
      formId,
      title: '11. Menurut Anda, sejauh mana Anda setuju atau tidak setuju bahwa bisnis milik keluarga di Indonesia menggunakan kebijakan dan praktik tata kelola yang dipimpin pendiri untuk mempengaruhi keputusan keuangan utama seperti distribusi dividen.',
      type: 'LINEAR_SCALE', isRequired: true, order: 11,
      options: ['1', '7', 'Sangat Tidak Setuju', 'Sangat Setuju']
    },
    // P12
    {
      formId,
      title: '12. Menurut Anda, sejauh mana Anda setuju atau tidak setuju bahwa bisnis milik keluarga di Indonesia menggunakan struktur kepemimpinan/manajemen lintas generasi yang unik untuk mempengaruhi keputusan strategis utama seperti keputusan keuangan termasuk distribusi dividen.',
      type: 'LINEAR_SCALE', isRequired: true, order: 12,
      options: ['1', '7', 'Sangat Tidak Setuju', 'Sangat Setuju']
    },

    // Header Bagian B2
    {
      formId,
      title: 'Bagian B2: Orientasi manajemen strategis pemimpin generasi pada bisnis manufaktur milik keluarga di Indonesia.',
      description: 'Catatan: Orientasi, Pola Pikir, atau Budaya Pemilik Bisnis Keluarga.',
      type: 'SECTION_HEADER', isRequired: false, order: 13, options: []
    },
    // P13
    {
      formId,
      title: '13. Menurut Anda, sejauh mana Anda setuju atau tidak setuju bahwa bisnis milik keluarga di Indonesia harus lebih menekankan pada profitabilitas perusahaan daripada tanggung jawab sosial perusahaan.',
      type: 'LINEAR_SCALE', isRequired: true, order: 14,
      options: ['1', '7', 'Sangat Tidak Setuju', 'Sangat Setuju']
    },
    // P14
    {
      formId,
      title: '14. Menurut Anda, sejauh mana Anda setuju atau tidak setuju bahwa bisnis milik keluarga di Indonesia harus lebih menekankan pada produksi berbiaya rendah (pengurangan biaya) daripada diferensiasi produk sebagai sumber keunggulan kompetitif.',
      type: 'LINEAR_SCALE', isRequired: true, order: 15,
      options: ['1', '7', 'Sangat Tidak Setuju', 'Sangat Setuju']
    },
    // P15
    {
      formId,
      title: '15. Menurut Anda, sejauh mana Anda setuju atau tidak setuju bahwa bisnis milik keluarga di Indonesia harus lebih menekankan pada perbaikan jangka pendek daripada jangka panjang (manajemen perubahan) untuk bertahan dan berkembang dalam konteks internasional.',
      type: 'LINEAR_SCALE', isRequired: true, order: 16,
      options: ['1', '7', 'Sangat Tidak Setuju', 'Sangat Setuju']
    },
    // P16
    {
      formId,
      title: '16. Menurut Anda, sejauh mana Anda setuju atau tidak setuju bahwa bisnis milik keluarga di Indonesia harus lebih menekankan pada kepatuhan terhadap regulasi industri manufaktur internasional daripada regulasi manufaktur Indonesia.',
      type: 'LINEAR_SCALE', isRequired: true, order: 17,
      options: ['1', '7', 'Sangat Tidak Setuju', 'Sangat Setuju']
    },

    // Akhir Kuesioner
    {
      formId,
      title: 'Akhir Kuesioner',
      description: 'Terima kasih telah menyelesaikan kuesioner ini; saya sangat menghargai partisipasi Anda.\nCc: florasamosir/supervisors/10February2026',
      type: 'SECTION_HEADER', isRequired: false, order: 18, options: []
    },
    // Area teks feedback
    {
      formId,
      title: 'Saran atau Pesan',
      description: 'Silakan tulis saran, komentar, atau pesan Anda di bawah ini.',
      type: 'LONG_TEXT', isRequired: false, order: 19,
      options: []
    },
  ]

  // Buat semua pertanyaan
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    console.log(`Membuat pertanyaan ${i + 1}/${questions.length}: ${q.title.substring(0, 50)}...`)
    const qRes = await fetch(`${BASE}/questions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(q)
    })
    const qData = await qRes.json()
    if (!qData.success) {
      console.error(`Gagal membuat pertanyaan ${i + 1}:`, qData)
      return
    }
  }

  // Publikasikan form
  console.log('Mempublikasikan form...')
  const pubRes = await fetch(`${BASE}/forms/${formId}/publish`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ isPublished: true })
  })
  const pubData = await pubRes.json()
  console.log('Dipublikasikan:', pubData.success)

  console.log('\n=== SELESAI ===')
  console.log(`URL Form: https://form-theta-virid.vercel.app/form/${formId}`)
  console.log(`URL Edit: https://form-theta-virid.vercel.app/form/${formId}/edit`)
}

main().catch(console.error)
