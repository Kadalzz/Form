import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { CheckCircle } from 'lucide-react'
import { apiService } from '@/services/api'

export default function FormView() {
  const { id } = useParams()
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: formData, isLoading } = useQuery({
    queryKey: ['form', id],
    queryFn: () => apiService.getForm(id!),
  })

  const submitMutation = useMutation({
    mutationFn: (data: any) => apiService.submitResponse(data),
    onSuccess: () => {
      setSubmitted(true)
    },
  })

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers({ ...answers, [questionId]: value })
    // Clear error when answered
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
        newErrors[question.id] = 'Pertanyaan ini wajib diisi'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // Scroll to first error
      const firstErrorId = Object.keys(newErrors)[0]
      document.getElementById(`question-${firstErrorId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    const submissionData = {
      formId: id!,
      answers: form.questions.map((q: any) => ({
        questionId: q.id,
        value: answers[q.id] || (q.type === 'CHECKBOX' ? [] : ''),
      })).filter((a: any) => a.value !== '' && (Array.isArray(a.value) ? a.value.length > 0 : true)),
    }

    await submitMutation.mutateAsync(submissionData)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0ebf8' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
      </div>
    )
  }

  if (!formData?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0ebf8' }}>
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Form tidak ditemukan</h2>
          <p className="text-gray-600">Form ini mungkin sudah dihapus atau tidak tersedia.</p>
        </div>
      </div>
    )
  }

  const form = formData.data

  if (!form.isPublished) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0ebf8' }}>
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Form tidak tersedia</h2>
          <p className="text-gray-600">Form ini sedang tidak menerima respons.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0ebf8' }}>
        <div className="max-w-lg w-full mx-4">
          <div className="bg-white rounded-lg shadow-sm border-t-[10px] border-purple-700 p-8 text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Respons Terkirim!</h2>
            <p className="text-gray-600">Terima kasih telah mengisi formulir ini.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-6 px-4" style={{ backgroundColor: '#f0ebf8' }}>
      <div className="max-w-2xl mx-auto space-y-3">

        {/* Form Title Card - Google Forms style with top purple border */}
        <div className="bg-white rounded-lg shadow-sm border-t-[10px] border-purple-700 px-6 pt-6 pb-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{form.title}</h1>
          {form.description && (
            <p className="text-sm text-gray-600 mt-1">{form.description}</p>
          )}
          <hr className="mt-4 border-gray-200" />
          <p className="text-xs text-red-600 mt-3">* Menunjukkan pertanyaan yang wajib diisi</p>
        </div>

        {/* Questions - Each in its own card like Google Forms */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {form.questions.map((question: any, index: number) => (
            <div
              key={question.id}
              id={`question-${question.id}`}
              className={`bg-white rounded-lg shadow-sm px-6 py-5 ${
                errors[question.id] ? 'border border-red-600' : ''
              }`}
            >
              {/* Question Title */}
              <div className="mb-4">
                <span className="text-base text-gray-900">
                  {index + 1}. {question.title}
                  {question.isRequired && <span className="text-red-600 ml-1">*</span>}
                </span>
                {question.description && (
                  <p className="text-sm text-gray-500 mt-1">{question.description}</p>
                )}
              </div>

              {/* SHORT TEXT - Google Forms style underline input */}
              {question.type === 'SHORT_TEXT' && (
                <input
                  type="text"
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-full border-0 border-b border-gray-300 px-0 py-2 text-sm focus:outline-none focus:border-purple-700 focus:border-b-2 transition-colors placeholder-gray-400"
                  placeholder="Jawaban Anda"
                />
              )}

              {/* LONG TEXT - Google Forms style textarea */}
              {question.type === 'LONG_TEXT' && (
                <textarea
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-full border-0 border-b border-gray-300 px-0 py-2 text-sm focus:outline-none focus:border-purple-700 focus:border-b-2 transition-colors placeholder-gray-400 resize-none"
                  rows={3}
                  placeholder="Jawaban Anda"
                />
              )}

              {/* MULTIPLE CHOICE - Google Forms style radio buttons */}
              {question.type === 'MULTIPLE_CHOICE' && (
                <div className="space-y-3">
                  {question.options?.map((option: string, optIndex: number) => (
                    <label
                      key={optIndex}
                      className="flex items-center space-x-3 cursor-pointer py-1"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        onChange={() => handleAnswerChange(question.id, option)}
                        className="w-[18px] h-[18px] cursor-pointer"
                        style={{ accentColor: '#7c3aed' }}
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* CHECKBOX - Google Forms style checkboxes */}
              {question.type === 'CHECKBOX' && (
                <div className="space-y-3">
                  {question.options?.map((option: string, optIndex: number) => {
                    const isChecked = ((answers[question.id] as string[]) || []).includes(option)
                    return (
                      <label
                        key={optIndex}
                        className="flex items-center space-x-3 cursor-pointer py-1"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleCheckboxChange(question.id, option, e.target.checked)}
                          className="w-[18px] h-[18px] rounded cursor-pointer"
                          style={{ accentColor: '#7c3aed' }}
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    )
                  })}
                </div>
              )}

              {/* Error message - Google Forms style */}
              {errors[question.id] && (
                <div className="flex items-center mt-3 text-red-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs">{errors[question.id]}</span>
                </div>
              )}
            </div>
          ))}

          {/* Submit Button - Google Forms style */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="px-8 py-2.5 rounded text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#7c3aed' }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#6d28d9')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#7c3aed')}
            >
              {submitMutation.isPending ? 'Mengirim...' : 'Kirim'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAnswers({})
                setErrors({})
                // Reset all form inputs
                const formEl = document.querySelector('form')
                formEl?.reset()
              }}
              className="text-sm font-medium text-purple-700 hover:text-purple-800 px-4 py-2"
            >
              Hapus Formulir
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
