// Simple translation dictionary for common form terms
const dictionary: Record<string, string> = {
  // Common words
  'the': '',
  'a': '',
  'an': '',
  'and': 'dan',
  'or': 'atau',
  'of': 'dari',
  'to': 'ke',
  'in': 'di',
  'on': 'pada',
  'at': 'di',
  'for': 'untuk',
  'with': 'dengan',
  'by': 'oleh',
  'from': 'dari',
  'is': 'adalah',
  'are': 'adalah',
  'was': 'adalah',
  'were': 'adalah',
  'your': 'Anda',
  'you': 'Anda',
  
  // Form-related terms
  'form': 'formulir',
  'questionnaire': 'kuesioner',
  'survey': 'survei',
  'question': 'pertanyaan',
  'answer': 'jawaban',
  'response': 'tanggapan',
  'submit': 'kirim',
  'send': 'kirim',
  'name': 'nama',
  'email': 'email',
  'phone': 'telepon',
  'address': 'alamat',
  'please': 'silakan',
  'enter': 'masukkan',
  'select': 'pilih',
  'choose': 'pilih',
  'click': 'klik',
  'required': 'wajib',
  'optional': 'opsional',
  
  // Academic terms
  'phd': 'PhD',
  'doctoral': 'doktoral',
  'research': 'penelitian',
  'university': 'universitas',
  'faculty': 'fakultas',
  'exploratory': 'eksploratori',
  'design': 'desain',
  'student': 'mahasiswa',
  'professor': 'profesor',
  'lecturer': 'dosen',
  'department': 'departemen',
  'program': 'program',
  'study': 'studi',
  'academic': 'akademik',
  'education': 'pendidikan',
  'degree': 'gelar',
  'thesis': 'tesis',
  'dissertation': 'disertasi',
  
  // Demographic terms
  'demographic': 'demografis',
  'characteristics': 'karakteristik',
  'respondent': 'responden',
  'respondents': 'responden',
  'participant': 'partisipan',
  'participants': 'partisipan',
  'age': 'usia',
  'gender': 'jenis kelamin',
  'sex': 'jenis kelamin',
  'male': 'laki-laki',
  'female': 'perempuan',
  'other': 'lainnya',
  'year': 'tahun',
  'years': 'tahun',
  'old': 'tahun',
  'yrs': 'tahun',
  'below': 'di bawah',
  'above': 'di atas',
  'between': 'antara',
  
  // Parts
  'part': 'bagian',
  'section': 'bagian',
  
  // Common question words
  'what': 'apa',
  'when': 'kapan',
  'where': 'di mana',
  'who': 'siapa',
  'why': 'mengapa',
  'how': 'bagaimana',
  'which': 'yang mana',
  
  // Business & Technology
  'business': 'bisnis',
  'technology': 'teknologi',
  'management': 'manajemen',
  'company': 'perusahaan',
  'organization': 'organisasi',
  'experience': 'pengalaman',
  'work': 'kerja',
  'job': 'pekerjaan',
  'position': 'posisi',
  'role': 'peran',
  
  // Likert scale terms
  'strongly': 'sangat',
  'agree': 'setuju',
  'disagree': 'tidak setuju',
  'neutral': 'netral',
  'very': 'sangat',
  'somewhat': 'agak',
  'not': 'tidak',
  
  // Numbers
  'one': 'satu',
  'two': 'dua',
  'three': 'tiga',
  'four': 'empat',
  'five': 'lima',
  'six': 'enam',
  'seven': 'tujuh',
  'eight': 'delapan',
  'nine': 'sembilan',
  'ten': 'sepuluh',
}

/**
 * Translates text from English to Indonesian using dictionary mapping
 * Falls back to original text if no translation is found
 */
export function translateToIndonesian(text: string): string {
  if (!text) return text
  
  // Split into sentences to preserve sentence structure
  const sentences = text.split(/([.!?]\s+)/)
  
  return sentences.map(sentence => {
    // Check if this is a punctuation
    if (/^[.!?]\s+$/.test(sentence)) return sentence
    
    // Split into words while preserving formatting
    const words = sentence.split(/(\s+|[,;:()[\]{}])/)
    
    const translated = words.map(word => {
      // Preserve whitespace and punctuation
      if (/^\s+$/.test(word) || /^[,;:()[\]{}]$/.test(word)) return word
      
      // Get the word in lowercase for lookup
      const lowerWord = word.toLowerCase()
      const plainWord = lowerWord.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '')
      
      // Check dictionary
      if (dictionary[plainWord]) {
        // Preserve original capitalization
        const translation = dictionary[plainWord]
        if (!translation) return '' // Remove articles
        
        if (word[0] === word[0].toUpperCase()) {
          return translation.charAt(0).toUpperCase() + translation.slice(1)
        }
        return translation
      }
      
      // Return original if not in dictionary
      return word
    })
    
    // Clean up extra spaces
    return translated.join('').replace(/\s+/g, ' ').trim()
  }).join('')
}

/**
 * Translate text based on selected language
 */
export function translate(text: string, language: 'en' | 'id'): string {
  if (language === 'en') return text
  return translateToIndonesian(text)
}
