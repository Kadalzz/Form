import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { FileText, CheckCircle } from 'lucide-react'
import { apiService } from '@/services/api'

export default function FormView() {
  const { id } = useParams()
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitted, setSubmitted] = useState(false)

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
  }

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    const currentAnswers = (answers[questionId] as string[]) || []
    const newAnswers = checked
      ? [...currentAnswers, option]
      : currentAnswers.filter((a) => a !== option)
    setAnswers({ ...answers, [questionId]: newAnswers })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required questions
    const form = formData?.data
    const requiredQuestions = form.questions.filter((q: any) => q.isRequired)
    
    for (const question of requiredQuestions) {
      if (!answers[question.id] || (Array.isArray(answers[question.id]) && answers[question.id].length === 0)) {
        alert(`Please answer the required question: "${question.title}"`)
        return
      }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!formData?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Form not found</h2>
          <p className="text-gray-600">This form may have been deleted or is not available.</p>
        </div>
      </div>
    )
  }

  const form = formData.data

  if (!form.isPublished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Form not available</h2>
          <p className="text-gray-600">This form is not currently accepting responses.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Response Submitted!</h2>
          <p className="text-gray-600">Thank you for filling out the form.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-md p-8 border-t-4 border-primary-600">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">{form.title}</h1>
          </div>
          {form.description && <p className="text-gray-600">{form.description}</p>}
        </div>

        {/* Questions */}
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-b-2xl p-8 space-y-6">
          {form.questions.map((question: any, index: number) => (
            <div key={question.id} className="pb-6 border-b border-gray-200 last:border-b-0">
              <label className="block mb-4">
                <span className="text-lg font-medium text-gray-900">
                  {index + 1}. {question.title}
                  {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                </span>
                {question.description && (
                  <span className="block text-sm text-gray-600 mt-1">{question.description}</span>
                )}
              </label>

              {question.type === 'SHORT_TEXT' && (
                <input
                  type="text"
                  required={question.isRequired}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Your answer"
                />
              )}

              {question.type === 'LONG_TEXT' && (
                <textarea
                  required={question.isRequired}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  placeholder="Your answer"
                />
              )}

              {question.type === 'MULTIPLE_CHOICE' && (
                <div className="space-y-2">
                  {question.options?.map((option: string, optIndex: number) => (
                    <label key={optIndex} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name={question.id}
                        required={question.isRequired}
                        onChange={() => handleAnswerChange(question.id, option)}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'CHECKBOX' && (
                <div className="space-y-2">
                  {question.options?.map((option: string, optIndex: number) => (
                    <label key={optIndex} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        onChange={(e) => handleCheckboxChange(question.id, option, e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  )
}
