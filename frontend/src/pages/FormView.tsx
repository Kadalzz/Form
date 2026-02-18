import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { CheckCircle, Send, Languages } from 'lucide-react'
import { apiService } from '@/services/api'
import { translate } from '@/utils/translate'

const translations = {
  en: {
    loading: 'Loading form...',
    notFound: 'Form not found',
    notFoundDesc: 'This form may have been deleted or is not available.',
    notAvailable: 'Form not available',
    notAvailableDesc: 'This form is not currently accepting responses.',
    submitted: 'Response Submitted!',
    submittedDesc: 'Thank you for filling out this form.',
    submitAnother: 'Submit another response',
    done: 'Done',
    requiredNote: 'Indicates required question',
    yourAnswer: 'Your answer',
    required: 'This question is required',
    sending: 'Sending...',
    send: 'Submit',
    clearForm: 'Clear Form',
    madeWith: 'Made with',
    respondentName: 'Respondent Name',
    respondentNamePlaceholder: 'Enter your name',
    respondentNameRequired: 'Please enter your name',
  },
  id: {
    loading: 'Memuat formulir...',
    notFound: 'Formulir tidak ditemukan',
    notFoundDesc: 'Formulir ini mungkin telah dihapus atau tidak tersedia.',
    notAvailable: 'Formulir tidak tersedia',
    notAvailableDesc: 'Formulir ini saat ini tidak menerima tanggapan.',
    submitted: 'Tanggapan Terkirim!',
    submittedDesc: 'Terima kasih telah mengisi formulir ini.',
    submitAnother: 'Kirim tanggapan lain',
    done: 'Selesai',
    requiredNote: 'Menandakan pertanyaan wajib',
    yourAnswer: 'Jawaban Anda',
    required: 'Pertanyaan ini wajib diisi',
    sending: 'Mengirim...',
    send: 'Kirim',
    clearForm: 'Hapus Formulir',
    madeWith: 'Dibuat dengan',
    respondentName: 'Nama Responden',
    respondentNamePlaceholder: 'Masukkan nama Anda',
    respondentNameRequired: 'Silakan masukkan nama Anda',
  },
}

// Helper: lighten a hex color for backgrounds
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, (num >> 16) + Math.round((255 - (num >> 16)) * percent))
  const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round((255 - ((num >> 8) & 0x00ff)) * percent))
  const b = Math.min(255, (num & 0x0000ff) + Math.round((255 - (num & 0x0000ff)) * percent))
  return `rgb(${r}, ${g}, ${b})`
}

// Convert Google Drive sharing URL to direct image URL
function toDirectImageUrl(url: string): string {
  if (!url) return url
  let fileId = ''
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (driveFileMatch) fileId = driveFileMatch[1]
  const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/)
  if (driveOpenMatch) fileId = driveOpenMatch[1]
  const driveUcMatch = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/)
  if (driveUcMatch) fileId = driveUcMatch[1]
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`
  }
  return url
}

// Helper: darken a hex color
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, Math.round((num >> 16) * (1 - percent)))
  const g = Math.max(0, Math.round(((num >> 8) & 0x00ff) * (1 - percent)))
  const b = Math.max(0, Math.round((num & 0x0000ff) * (1 - percent)))
  return `rgb(${r}, ${g}, ${b})`
}

export default function FormView() {
  const { id } = useParams()
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [responderName, setResponderName] = useState('')
  const [nameError, setNameError] = useState('')
  const [language, setLanguage] = useState<'en' | 'id'>('en')
  const t = translations[language]

  const { data: formData, isLoading } = useQuery({
    queryKey: ['form', id],
    queryFn: () => apiService.getForm(id!),
    refetchOnMount: 'always', // Always fetch fresh form data
    staleTime: 0, // Consider data stale immediately to get latest questions
  })

  const submitMutation = useMutation({
    mutationFn: (data: any) => apiService.submitResponse(data),
    onSuccess: () => {
      setSubmitted(true)
    },
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to submit response'
      alert(`Error: ${errorMsg}`)
      console.error('Submission error:', error)
    },
  })

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers({ ...answers, [questionId]: value })
    if (errors[questionId]) {
      setErrors({ ...errors, [questionId]: '' })
    }
  }

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    const currentAnswers = (answers[questionId] as string[]) || []
    const newAnswers = checked
      ? [...currentAnswers, option]
      : currentAnswers.filter((a) => a !== option)
    setAnswers({ ...answers, [questionId]: newAnswers })
    if (errors[questionId]) {
      setErrors({ ...errors, [questionId]: '' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const form = formData?.data
    const requiredQuestions = form.questions.filter((q: any) => q.isRequired)
    const newErrors: Record<string, string> = {}

    for (const question of requiredQuestions) {
      const answer = answers[question.id]
      if (!answer || (Array.isArray(answer) && answer.length === 0) || answer === '') {
        newErrors[question.id] = t.required
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      const firstErrorId = Object.keys(newErrors)[0]
      document.getElementById(`question-${firstErrorId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    // Validate respondent name
    if (!responderName.trim()) {
      setNameError(t.respondentNameRequired)
      document.getElementById('responder-name-field')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setNameError('')

    const submissionData = {
      formId: id!,
      responderName: responderName.trim(),
      answers: form.questions
        .filter((q: any) => q.type !== 'SECTION_HEADER')
        .map((q: any) => ({
          questionId: q.id,
          value: answers[q.id] || (q.type === 'CHECKBOX' ? [] : ''),
        })).filter((a: any) => a.value !== '' && (Array.isArray(a.value) ? a.value.length > 0 : true)),
    }

    await submitMutation.mutateAsync(submissionData)
  }

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">{t.loading}</p>
        </div>
      </div>
    )
  }

  // --- Not Found ---
  if (!formData?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t.notFound}</h2>
          <p className="text-gray-500">{t.notFoundDesc}</p>
        </div>
      </div>
    )
  }

  const form = formData.data
  const theme = form.themeColor || '#673AB7'
  const bgColor = lightenColor(theme, 0.92)
  const headerImg = toDirectImageUrl(form.headerImage || '')
  const logo = toDirectImageUrl(form.logoUrl || '')

  // --- Not Published ---
  if (!form.isPublished) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: lightenColor(theme, 0.85) }}>
            <svg className="w-8 h-8" style={{ color: theme }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t.notAvailable}</h2>
          <p className="text-gray-500">{t.notAvailableDesc}</p>
        </div>
      </div>
    )
  }

  // --- Submitted State ---
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <div className="max-w-lg w-full mx-4">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="h-2" style={{ backgroundColor: theme }}></div>
            <div className="p-10 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: lightenColor(theme, 0.85) }}>
                <CheckCircle className="w-12 h-12" style={{ color: theme }} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t.submitted}</h2>
              <p className="text-gray-500 mb-6">{t.submittedDesc}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSubmitted(false)
                    setAnswers({})
                    setErrors({})
                    setResponderName('')
                    setNameError('')
                  }}
                  className="px-6 py-2.5 rounded-full text-sm font-medium text-white transition-all hover:shadow-lg"
                  style={{ backgroundColor: theme }}
                >
                  {t.submitAnother}
                </button>
                <button
                  onClick={() => window.close()}
                  className="px-6 py-2.5 rounded-full text-sm font-medium border-2 transition-all hover:shadow-md"
                  style={{ borderColor: theme, color: theme }}
                >
                  {t.done}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- Main Form View ---
  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      {/* Header Banner Image */}
      {headerImg && (
        <div className="relative w-full h-52 md:h-64 overflow-hidden">
          <img
            src={headerImg}
            alt="Form header"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${theme}33 0%, ${theme}99 100%)`,
            }}
          />
        </div>
      )}

      <div className={`max-w-2xl mx-auto px-3 sm:px-4 space-y-3 ${headerImg ? '-mt-6' : 'pt-6'} pb-8`}>

        {/* Form Title Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="h-3" style={{ backgroundColor: theme }}></div>
          <div className="px-4 sm:px-6 pt-5 pb-5">
            {/* Language Toggle Button */}
            <div className="flex justify-end mb-3">
              <button
                onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
                className="flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-medium transition-all hover:shadow-md border-2"
                style={{ 
                  borderColor: lightenColor(theme, 0.6),
                  color: theme,
                  backgroundColor: lightenColor(theme, 0.95)
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = lightenColor(theme, 0.85)
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = lightenColor(theme, 0.95)
                }}
              >
                <Languages className="w-4 h-4" />
                <span>{language === 'en' ? 'ID' : 'EN'}</span>
              </button>
            </div>
            {/* Logo and Title */}
            <div className="flex items-start space-x-3 sm:space-x-4">
              {logo && (
                <img
                  src={logo}
                  alt="Form logo"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover flex-shrink-0 border-2 shadow-sm"
                  style={{ borderColor: lightenColor(theme, 0.6) }}
                />
              )}
              <div className="flex-1 min-w-0 overflow-hidden">
                <h1
                  className="text-xl sm:text-2xl md:text-[26px] font-bold leading-tight break-words"
                  style={{ color: darkenColor(theme, 0.15) }}
                >
                  {translate(form.title, language)}
                </h1>
                {form.description && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-line break-words">
                    {translate(form.description, language)}
                  </p>
                )}
              </div>
            </div>
            <hr className="mt-4 border-gray-200" />
            <p className="text-xs mt-3" style={{ color: theme }}>
              <span className="font-medium">*</span> {t.requiredNote}
            </p>
          </div>
        </div>

        {/* Respondent Name Card */}
        <div
          id="responder-name-field"
          className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all ${
            nameError ? 'ring-1 ring-red-400 shadow-red-100' : 'hover:shadow-md'
          }`}
        >
          <div className="flex">
            <div
              className="w-1 flex-shrink-0 rounded-l-xl"
              style={{ backgroundColor: nameError ? '#ef4444' : 'transparent' }}
            ></div>
            <div className="flex-1 px-4 sm:px-6 py-5">
              <h3 className="text-sm sm:text-base text-gray-800 font-medium leading-relaxed mb-4 break-words">
                {t.respondentName}
                <span className="text-red-500 ml-1 font-normal">*</span>
              </h3>
              <input
                type="text"
                value={responderName}
                onChange={(e) => {
                  setResponderName(e.target.value)
                  if (nameError) setNameError('')
                }}
                className="w-full border-0 border-b-2 border-gray-200 px-0 py-2 text-sm transition-colors placeholder-gray-400 bg-transparent focus:outline-none"
                onFocus={(e) => { e.target.style.borderBottomColor = theme }}
                onBlur={(e) => { e.target.style.borderBottomColor = '#e5e7eb' }}
                placeholder={t.respondentNamePlaceholder}
              />
              {nameError && (
                <div className="flex items-center mt-3 text-red-500">
                  <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium">{nameError}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Questions */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {form.questions.map((question: any) => {
            // SECTION_HEADER - rendered as a colored banner
            if (question.type === 'SECTION_HEADER') {
              return (
                <div
                  key={question.id}
                  className="rounded-xl overflow-hidden shadow-sm"
                >
                  <div
                    className="px-4 sm:px-6 py-4"
                    style={{ backgroundColor: theme }}
                  >
                    <h2 className="text-base sm:text-lg font-bold text-white leading-snug break-words">
                      {translate(question.title, language)}
                    </h2>
                    {question.description && (
                      <p className="text-sm text-white/80 mt-1 break-words">{translate(question.description, language)}</p>
                    )}
                  </div>
                </div>
              )
            }

            return (
            <div
              key={question.id}
              id={`question-${question.id}`}
              className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all ${
                errors[question.id]
                  ? 'ring-1 ring-red-400 shadow-red-100'
                  : 'hover:shadow-md'
              }`}
            >
              {/* Colored left accent bar */}
              <div className="flex">
                <div
                  className="w-1 flex-shrink-0 rounded-l-xl"
                  style={{
                    backgroundColor: errors[question.id] ? '#ef4444' : 'transparent',
                  }}
                ></div>

                <div className="flex-1 px-4 sm:px-6 py-5">
                  {/* Question Title */}
                  <div className="mb-4">
                    <h3 className="text-sm sm:text-base text-gray-800 font-medium leading-relaxed break-words">
                      {translate(question.title, language)}
                      {question.isRequired && (
                        <span className="text-red-500 ml-1 font-normal">*</span>
                      )}
                    </h3>
                    {question.description && (
                      <p className="text-sm text-gray-500 mt-1 break-words">{translate(question.description, language)}</p>
                    )}
                  </div>

                  {/* SHORT TEXT */}
                  {question.type === 'SHORT_TEXT' && (
                    <input
                      type="text"
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="w-full border-0 border-b-2 border-gray-200 px-0 py-2 text-sm transition-colors placeholder-gray-400 bg-transparent focus:outline-none"
                      onFocus={(e) => {
                        e.target.style.borderBottomColor = theme
                      }}
                      onBlur={(e) => {
                        e.target.style.borderBottomColor = '#e5e7eb'
                      }}
                      placeholder={t.yourAnswer}
                    />
                  )}

                  {/* LONG TEXT */}
                  {question.type === 'LONG_TEXT' && (
                    <textarea
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="w-full border-0 border-b-2 border-gray-200 px-0 py-2 text-sm transition-colors placeholder-gray-400 resize-none bg-transparent focus:outline-none"
                      rows={3}
                      onFocus={(e) => {
                        e.target.style.borderBottomColor = theme
                      }}
                      onBlur={(e) => {
                        e.target.style.borderBottomColor = '#e5e7eb'
                      }}
                      placeholder={t.yourAnswer}
                    />
                  )}

                  {/* MULTIPLE CHOICE */}
                  {question.type === 'MULTIPLE_CHOICE' && (
                    <div className="space-y-2.5">
                      {question.options?.map((option: string, optIndex: number) => {
                        const isSelected = answers[question.id] === option
                        return (
                          <label
                            key={optIndex}
                            className={`flex items-start space-x-3 cursor-pointer px-2 sm:px-3 py-2.5 rounded-lg transition-all ${
                              isSelected
                                ? 'bg-opacity-10'
                                : 'hover:bg-gray-50'
                            }`}
                            style={isSelected ? { backgroundColor: lightenColor(theme, 0.9) } : {}}
                          >
                            <div
                              className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                              style={{
                                borderColor: isSelected ? theme : '#d1d5db',
                              }}
                            >
                              {isSelected && (
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme }}></div>
                              )}
                            </div>
                            <input
                              type="radio"
                              name={question.id}
                              onChange={() => handleAnswerChange(question.id, option)}
                              className="sr-only"
                            />
                            <span className="text-xs sm:text-sm text-gray-700 break-words flex-1 min-w-0">{translate(option, language)}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {/* CHECKBOX */}
                  {question.type === 'CHECKBOX' && (
                    <div className="space-y-2.5">
                      {question.options?.map((option: string, optIndex: number) => {
                        const isChecked = ((answers[question.id] as string[]) || []).includes(option)
                        return (
                          <label
                            key={optIndex}
                            className={`flex items-start space-x-3 cursor-pointer px-2 sm:px-3 py-2.5 rounded-lg transition-all ${
                              isChecked
                                ? ''
                                : 'hover:bg-gray-50'
                            }`}
                            style={isChecked ? { backgroundColor: lightenColor(theme, 0.9) } : {}}
                          >
                            <div
                              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all"
                              style={{
                                borderColor: isChecked ? theme : '#d1d5db',
                                backgroundColor: isChecked ? theme : 'transparent',
                              }}
                            >
                              {isChecked && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleCheckboxChange(question.id, option, e.target.checked)}
                              className="sr-only"
                            />
                            <span className="text-xs sm:text-sm text-gray-700 break-words flex-1 min-w-0">{translate(option, language)}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {/* LINEAR SCALE - Likert scale like Google Forms */}
                  {question.type === 'LINEAR_SCALE' && (() => {
                    // options format: ["1", "7", "Very Strongly Disagree", "Very Strongly Agree"]
                    const opts = question.options || ["1", "7", "", ""]
                    const minVal = parseInt(opts[0] || "1")
                    const maxVal = parseInt(opts[1] || "7")
                    const minLabel = opts[2] || ""
                    const maxLabel = opts[3] || ""
                    const scaleValues = Array.from({ length: maxVal - minVal + 1 }, (_, i) => minVal + i)
                    const selectedValue = answers[question.id] as string

                    return (
                      <div className="mt-2">
                        {/* Scale Labels - Mobile First */}
                        <div className="flex flex-col md:hidden space-y-1 mb-3">
                          {minLabel && (
                            <div className="text-xs text-gray-500 font-medium break-words">
                              <span className="font-semibold">{minVal}:</span> {translate(minLabel, language)}
                            </div>
                          )}
                          {maxLabel && (
                            <div className="text-xs text-gray-500 font-medium break-words">
                              <span className="font-semibold">{maxVal}:</span> {translate(maxLabel, language)}
                            </div>
                          )}
                        </div>
                        {/* Scale numbers header */}
                        <div className="flex items-center justify-center -mx-2 px-2">
                          {minLabel && (
                            <span className="hidden md:block text-xs text-gray-500 font-medium mr-3 w-28 text-right flex-shrink-0 break-words">{translate(minLabel, language)}</span>
                          )}
                          <div className="flex items-center space-x-0 overflow-x-auto max-w-full pb-1">
                            {scaleValues.map((val) => (
                              <div key={val} className="flex flex-col items-center flex-shrink-0" style={{ minWidth: '36px' }}>
                                <span className="text-xs text-gray-500 font-medium mb-2">{val}</span>
                                <label className="cursor-pointer">
                                  <input
                                    type="radio"
                                    name={question.id}
                                    value={String(val)}
                                    onChange={() => handleAnswerChange(question.id, String(val))}
                                    className="sr-only"
                                  />
                                  <div
                                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all hover:border-gray-400"
                                    style={{
                                      borderColor: selectedValue === String(val) ? theme : '#d1d5db',
                                    }}
                                  >
                                    {selectedValue === String(val) && (
                                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme }}></div>
                                    )}
                                  </div>
                                </label>
                              </div>
                            ))}
                          </div>
                          {maxLabel && (
                            <span className="hidden md:block text-xs text-gray-500 font-medium ml-3 w-28 flex-shrink-0 break-words">{translate(maxLabel, language)}</span>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Error */}
                  {errors[question.id] && (
                    <div className="flex items-center mt-3 text-red-500">
                      <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-medium">{errors[question.id]}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            )
          })}

          {/* Closing Message */}
          {form?.closingMessage && (
            <div className="mt-6 mb-4 p-4 bg-gray-50 rounded-lg border-l-4" style={{ borderLeftColor: theme }}>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{form.closingMessage}</p>
            </div>
          )}

          {/* Submit Area */}
          <div className="flex items-center justify-between pt-3 pb-4">
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="flex items-center space-x-2 px-8 py-3 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: theme }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = darkenColor(theme, 0.15)
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = theme
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Send className="w-4 h-4" />
              <span>{submitMutation.isPending ? t.sending : t.send}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAnswers({})
                setErrors({})
                setResponderName('')
                setNameError('')
                const formEl = document.querySelector('form')
                formEl?.reset()
              }}
              className="text-sm font-medium px-4 py-2 rounded-full transition-colors"
              style={{ color: theme }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = lightenColor(theme, 0.9)
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {t.clearForm}
            </button>
          </div>
        </form>

        {/* Footer Branding */}
        <div className="text-center pb-4">
          <p className="text-xs text-gray-400">
            {t.madeWith} <span style={{ color: theme }}>Form Builder</span>
          </p>
        </div>
      </div>
    </div>
  )
}
