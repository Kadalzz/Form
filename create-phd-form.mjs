// Script to create the PHD Exploratory Questionnaire for FloraSamosir
const BASE = 'https://form-theta-virid.vercel.app/api'

async function main() {
  // First, push the code and wait for deployment, then login
  console.log('Logging in as FloraSamosir...')
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gebychristy@gmail.com', password: '12Mei2002' })
  })
  const loginData = await loginRes.json()
  if (!loginData.success) {
    console.error('Login failed:', loginData)
    return
  }
  const token = loginData.data.token
  console.log('Login successful! Token:', token.substring(0, 20) + '...')

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  // Create the form with maroon theme and academic header
  console.log('Creating form...')
  const formRes = await fetch(`${BASE}/forms`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'PHD EXPLORATORY QUESTIONNAIRE DESIGN',
      description: 'University of Sunderland UK, Faculty of Business & Technology\n10 February 2026',
      themeColor: '#7B1F3A',
      headerImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=300&fit=crop',
      logoUrl: '',
    })
  })
  const formData = await formRes.json()
  if (!formData.success) {
    console.error('Form creation failed:', formData)
    return
  }
  const formId = formData.data.id
  console.log('Form created! ID:', formId)

  // Define all questions
  const questions = [
    // Section A Header
    {
      formId, title: 'Part A: Demographic Characteristics of Respondents',
      type: 'SECTION_HEADER', isRequired: false, order: 0, options: []
    },
    // Q1 - Age
    {
      formId, title: '1. Age',
      type: 'MULTIPLE_CHOICE', isRequired: false, order: 1,
      options: ['Below 30 yrs', '30-34 yrs', '35-44 yrs', '45-54 yrs', '55-60 yrs', 'Above 60 yrs']
    },
    // Q2 - Sex/Gender
    {
      formId, title: '2. Sex/Gender',
      type: 'MULTIPLE_CHOICE', isRequired: false, order: 2,
      options: ['Female', 'Male', 'Not Applicable']
    },
    // Q4 - Experience
    {
      formId, title: '4. Experience',
      type: 'MULTIPLE_CHOICE', isRequired: false, order: 3,
      options: ['Below 5 yrs', '6-10 yrs', 'Above 10 years']
    },
    // Q5 - Ethnicity/Origin
    {
      formId, title: '5. Ethnicity/Origin',
      type: 'MULTIPLE_CHOICE', isRequired: false, order: 4,
      options: ['Javanese', 'Chinese', 'Minority']
    },
    // Q6 - Religion (required)
    {
      formId, title: '6. Religion',
      type: 'MULTIPLE_CHOICE', isRequired: true, order: 5,
      options: ['Islam', 'Christian', 'Buddhist', 'Hinduist', 'Others']
    },
    // Q7 - Education/Qualification
    {
      formId, title: '7. Education/Qualification',
      type: 'MULTIPLE_CHOICE', isRequired: false, order: 6,
      options: ['Doctorate', 'Postgraduate', 'Undergraduate', 'Secondary', 'Others']
    },
    // Q8 - Marital Status
    {
      formId, title: '8. Marital Status',
      type: 'MULTIPLE_CHOICE', isRequired: false, order: 7,
      options: ['Married', 'Single', 'Others']
    },
    // Q9 - Political affiliation
    {
      formId,
      title: '9. Political affiliation',
      description: 'PDI-P: Indonesian Democratic Party of Struggle, Partai Demokrasi Indonesia Perjuangan. Golkar: Party of Functional Groups, Partai Golongan Karya. Gerindra: Great Indonesia Movement Party, Partai Gerakan Indonesia Raya.',
      type: 'MULTIPLE_CHOICE', isRequired: false, order: 8,
      options: ['PDI-P', 'Golkar', 'Gerindra', 'Others']
    },

    // Section B Header
    {
      formId, title: 'Part B: Main Themes',
      description: 'Part B1: Family-owned and Related businesses in Indonesia.',
      type: 'SECTION_HEADER', isRequired: false, order: 9, options: []
    },
    // Q10
    {
      formId,
      title: '10. In your opinion, to what extent do agree or disagree that Family-owned businesses continue to contribute to the gross domestic product of Indonesia?',
      type: 'LINEAR_SCALE', isRequired: true, order: 10,
      options: ['1', '7', 'Very Strongly Disagree', 'Very Strongly Agree']
    },
    // Q11
    {
      formId,
      title: '11. In your opinion, to what extent do you agree or disagree that Family-owned businesses in Indonesia use their unique founder-led governance policies and practices to influence key financial decisions such as dividend distribution.',
      type: 'LINEAR_SCALE', isRequired: true, order: 11,
      options: ['1', '7', 'Very Strongly Disagree', 'Very Strongly Agree']
    },
    // Q12
    {
      formId,
      title: '12. In your opinion, to what extent do you agree or disagree that Family-owned businesses in Indonesia use their unique generational leadership/management structure to influence key strategic decisions e.g., financial decisions such as dividend distribution.',
      type: 'LINEAR_SCALE', isRequired: true, order: 12,
      options: ['1', '7', 'Very Strongly Disagree', 'Very Strongly Agree']
    },

    // Section B2 Header
    {
      formId,
      title: 'Part B2: Strategic management orientation of Generational leaders of Family-owned manufacturing businesses in Indonesia.',
      description: 'Note: Family Business Owner Orientations or Mindsets or Culture.',
      type: 'SECTION_HEADER', isRequired: false, order: 13, options: []
    },
    // Q13
    {
      formId,
      title: '13. In your opinion, to what extent do you agree or disagree that Family-owned businesses in Indonesia should place more emphasis on corporate profitability over corporate social responsibility.',
      type: 'LINEAR_SCALE', isRequired: true, order: 14,
      options: ['1', '7', 'Very Strongly Disagree', 'Very Strongly Agree']
    },
    // Q14
    {
      formId,
      title: '14. In your opinion, to what extent do you agree or disagree that Family-owned businesses in Indonesia should more emphasis on low-cost production (cost reduction) over product differentiation as a source of competitive advantage.',
      type: 'LINEAR_SCALE', isRequired: true, order: 15,
      options: ['1', '7', 'Very Strongly Disagree', 'Very Strongly Agree']
    },
    // Q15
    {
      formId,
      title: '15. In your opinion, to what extent do you agree or disagree that Family-owned businesses in Indonesia should more emphasis on short-term over long-term improvement (change management) processes to survive and growth in an international context.',
      type: 'LINEAR_SCALE', isRequired: true, order: 16,
      options: ['1', '7', 'Very Strongly Disagree', 'Very Strongly Agree']
    },
    // Q16
    {
      formId,
      title: '16. In your opinion, to what extent do you agree or disagree that Family-owned businesses in Indonesia should more emphasis on complying with international manufacturing industry regulations over Indonesian manufacturing regulations.',
      type: 'LINEAR_SCALE', isRequired: true, order: 17,
      options: ['1', '7', 'Very Strongly Disagree', 'Very Strongly Agree']
    },

    // End of Questionnaire section
    {
      formId,
      title: 'End of Questionnaire',
      description: 'Thank you for completing this questionnaire; I greatly appreciate it.\nCc: florasamosir/supervisors/10February2026',
      type: 'SECTION_HEADER', isRequired: false, order: 18, options: []
    },
    // Feedback text area
    {
      formId,
      title: 'Saran atau Pesan',
      description: 'Silakan tulis saran, komentar, atau pesan Anda di bawah ini.',
      type: 'LONG_TEXT', isRequired: false, order: 19,
      options: []
    },
  ]

  // Create all questions
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    console.log(`Creating question ${i + 1}/${questions.length}: ${q.title.substring(0, 50)}...`)
    const qRes = await fetch(`${BASE}/questions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(q)
    })
    const qData = await qRes.json()
    if (!qData.success) {
      console.error(`Failed to create question ${i + 1}:`, qData)
      return
    }
  }

  // Publish the form
  console.log('Publishing form...')
  const pubRes = await fetch(`${BASE}/forms/${formId}/publish`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ isPublished: true })
  })
  const pubData = await pubRes.json()
  console.log('Published:', pubData.success)

  console.log('\n=== DONE ===')
  console.log(`Form URL: https://form-theta-virid.vercel.app/form/${formId}`)
  console.log(`Edit URL: https://form-theta-virid.vercel.app/form/${formId}/edit`)
}

main().catch(console.error)
