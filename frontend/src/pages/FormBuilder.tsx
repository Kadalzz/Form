import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, GripVertical, Save, ArrowLeft, X, Image, Palette, Eye } from 'lucide-react'
import { apiService } from '@/services/api'

type QuestionType = 'SHORT_TEXT' | 'LONG_TEXT' | 'MULTIPLE_CHOICE' | 'CHECKBOX'

interface Question {
  id?: string
  title: string
  description?: string
  type: QuestionType
  isRequired: boolean
  order: number
  options?: string[]
}

const PRESET_COLORS = [
  { name: 'Deep Purple', value: '#673AB7' },
  { name: 'Maroon', value: '#7B1F3A' },
  { name: 'Dark Red', value: '#8B1A1A' },
  { name: 'Indigo', value: '#3F51B5' },
  { name: 'Teal', value: '#009688' },
  { name: 'Blue', value: '#1565C0' },
  { name: 'Green', value: '#2E7D32' },
  { name: 'Dark Cyan', value: '#00695C' },
  { name: 'Brown', value: '#5D4037' },
  { name: 'Dark Blue', value: '#1A237E' },
]

const PRESET_BANNERS = [
  { name: 'None', value: '' },
  { name: 'Academic Blue', value: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&h=300&fit=crop' },
  { name: 'Books', value: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=300&fit=crop' },
  { name: 'Research', value: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=1200&h=300&fit=crop' },
  { name: 'Floral', value: 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=1200&h=300&fit=crop' },
  { name: 'Nature', value: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=300&fit=crop' },
]

export default function FormBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditMode = !!id

  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [headerImage, setHeaderImage] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [themeColor, setThemeColor] = useState('#673AB7')
  const [customBannerUrl, setCustomBannerUrl] = useState('')
  const [showDesignPanel, setShowDesignPanel] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])

  const { data: formData, isLoading } = useQuery({
    queryKey: ['form', id],
    queryFn: () => apiService.getForm(id!),
    enabled: isEditMode,
  })

  useEffect(() => {
    if (formData?.data) {
      setFormTitle(formData.data.title)
      setFormDescription(formData.data.description || '')
      setHeaderImage(formData.data.headerImage || '')
      setLogoUrl(formData.data.logoUrl || '')
      setThemeColor(formData.data.themeColor || '#673AB7')
      setQuestions(formData.data.questions || [])
    }
  }, [formData])

  const createFormMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) => apiService.createForm(data),
    onSuccess: (response) => {
      navigate(`/form/${response.data.id}/edit`)
    },
  })

  const updateFormMutation = useMutation({
    mutationFn: (data: any) => apiService.updateForm(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form', id] })
    },
  })

  const createQuestionMutation = useMutation({
    mutationFn: (data: any) => apiService.createQuestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form', id] })
    },
  })

  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiService.updateQuestion(id, data),
  })

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => apiService.deleteQuestion(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form', id] })
    },
  })

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      title: '',
      type: 'SHORT_TEXT',
      isRequired: false,
      order: questions.length,
      options: [''],
    }
    setQuestions([...questions, newQuestion])
  }

  const handleUpdateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    // When switching to MULTIPLE_CHOICE or CHECKBOX, ensure at least one option exists
    if (field === 'type' && (value === 'MULTIPLE_CHOICE' || value === 'CHECKBOX')) {
      if (!updated[index].options || updated[index].options!.length === 0) {
        updated[index].options = ['']
      }
    }
    setQuestions(updated)
  }

  const handleDeleteQuestion = async (index: number) => {
    const question = questions[index]
    if (question.id) {
      await deleteQuestionMutation.mutateAsync(question.id)
    }
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    try {
      let formId = id

      const formPayload = {
        title: formTitle,
        description: formDescription || undefined,
        headerImage: headerImage || undefined,
        logoUrl: logoUrl || undefined,
        themeColor: themeColor || '#673AB7',
      }

      // Create or update form
      if (!isEditMode) {
        const response = await createFormMutation.mutateAsync(formPayload)
        formId = response.data.id
      } else {
        await updateFormMutation.mutateAsync(formPayload)
      }

      // Save all questions
      for (const question of questions) {
        if (question.title.trim()) {
          // Clean up options - filter empty strings
          const cleanOptions = (question.options || []).filter(o => o.trim() !== '')
          const questionData = {
            formId: formId!,
            title: question.title,
            description: question.description || undefined,
            type: question.type,
            isRequired: question.isRequired,
            order: question.order,
            options: cleanOptions.length > 0 ? cleanOptions : undefined,
          }

          if (question.id) {
            await updateQuestionMutation.mutateAsync({ id: question.id, data: questionData })
          } else {
            await createQuestionMutation.mutateAsync(questionData)
          }
        }
      }

      alert('Form saved successfully!')
      queryClient.invalidateQueries({ queryKey: ['form', formId] })
      if (!isEditMode) {
        navigate(`/form/${formId}/edit`)
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Unknown error'
      alert(`Failed to save form: ${msg}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDesignPanel(!showDesignPanel)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Palette className="w-4 h-4" />
            <span className="text-sm">{showDesignPanel ? 'Hide Design' : 'Design'}</span>
          </button>
          {isEditMode && (
            <button
              onClick={() => window.open(`/form/${id}`, '_blank')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm">Preview</span>
            </button>
          )}
        </div>
      </div>

      {/* Design Panel */}
      {showDesignPanel && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4" style={{ borderLeftColor: themeColor }}>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>Desain Formulir</span>
          </h3>

          {/* Theme Color */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Warna Tema</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setThemeColor(color.value)}
                  className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color.value,
                    borderColor: themeColor === color.value ? '#000' : 'transparent',
                    transform: themeColor === color.value ? 'scale(1.15)' : undefined,
                  }}
                  title={color.name}
                />
              ))}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                placeholder="#673AB7"
              />
            </div>
          </div>

          {/* Header Banner Image */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Image className="w-4 h-4 inline mr-1" />
              Gambar Header
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {PRESET_BANNERS.map((banner) => (
                <button
                  key={banner.name}
                  onClick={() => {
                    setHeaderImage(banner.value)
                    setCustomBannerUrl('')
                  }}
                  className={`relative h-16 rounded-lg border-2 overflow-hidden transition-all ${
                    headerImage === banner.value ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {banner.value ? (
                    <img src={banner.value} alt={banner.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                      Tanpa Header
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-2">
              <input
                type="text"
                value={customBannerUrl}
                onChange={(e) => {
                  setCustomBannerUrl(e.target.value)
                  setHeaderImage(e.target.value)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Atau tempel URL gambar header..."
              />
            </div>
          </div>

          {/* Logo URL */}
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo / Foto Profil (URL)</label>
            <div className="flex items-center space-x-3">
              {logoUrl && (
                <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" />
              )}
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Tempel URL logo/foto profil..."
              />
              {logoUrl && (
                <button onClick={() => setLogoUrl('')} className="text-gray-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Preview Snippet */}
          {(headerImage || logoUrl) && (
            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
              <p className="text-xs text-gray-500 px-3 py-1 bg-gray-50">Preview</p>
              {headerImage && (
                <div className="h-24 overflow-hidden">
                  <img src={headerImage} alt="Header Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="px-4 py-3 flex items-center space-x-3" style={{ borderTop: `4px solid ${themeColor}` }}>
                {logoUrl && <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover" />}
                <div>
                  <p className="font-semibold text-sm" style={{ color: themeColor }}>{formTitle || 'Judul Formulir'}</p>
                  <p className="text-xs text-gray-500">{formDescription || 'Deskripsi'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {isEditMode ? 'Edit Form' : 'Create New Form'}
        </h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Form Title *</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter form title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Enter form description (optional)"
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4 mb-6">
        {questions.map((question, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <GripVertical className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
              </div>
              <button
                onClick={() => handleDeleteQuestion(index)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={question.title}
                onChange={(e) => handleUpdateQuestion(index, 'title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Question title"
              />

              <div className="flex space-x-4">
                <select
                  value={question.type}
                  onChange={(e) => handleUpdateQuestion(index, 'type', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="SHORT_TEXT">Short Text</option>
                  <option value="LONG_TEXT">Long Text</option>
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  <option value="CHECKBOX">Checkbox</option>
                </select>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={question.isRequired}
                    onChange={(e) => handleUpdateQuestion(index, 'isRequired', e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Required</span>
                </label>
              </div>

              {(question.type === 'MULTIPLE_CHOICE' || question.type === 'CHECKBOX') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pilihan Jawaban</label>
                  <div className="space-y-2">
                    {(question.options || []).map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center space-x-2">
                        {/* Icon indicator */}
                        {question.type === 'MULTIPLE_CHOICE' ? (
                          <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 flex-shrink-0" />
                        ) : (
                          <div className="w-[18px] h-[18px] rounded-sm border-2 border-gray-300 flex-shrink-0" />
                        )}
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(question.options || [])]
                            newOptions[optIndex] = e.target.value
                            handleUpdateQuestion(index, 'options', newOptions)
                          }}
                          className="flex-1 px-3 py-1.5 border-0 border-b border-gray-300 focus:outline-none focus:border-purple-600 focus:border-b-2 text-sm"
                          placeholder={`Opsi ${optIndex + 1}`}
                        />
                        {(question.options || []).length > 1 && (
                          <button
                            onClick={() => {
                              const newOptions = (question.options || []).filter((_, i) => i !== optIndex)
                              handleUpdateQuestion(index, 'options', newOptions)
                            }}
                            className="text-gray-400 hover:text-red-500 flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newOptions = [...(question.options || []), '']
                        handleUpdateQuestion(index, 'options', newOptions)
                      }}
                      className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-800 mt-2 py-1"
                    >
                      {question.type === 'MULTIPLE_CHOICE' ? (
                        <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 border-dashed flex-shrink-0" />
                      ) : (
                        <div className="w-[18px] h-[18px] rounded-sm border-2 border-gray-300 border-dashed flex-shrink-0" />
                      )}
                      <span>Tambah opsi</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleAddQuestion}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Question</span>
        </button>

        <button
          onClick={handleSave}
          disabled={!formTitle.trim()}
          className="flex items-center space-x-2 px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          <span>Save Form</span>
        </button>
      </div>
    </div>
  )
}
