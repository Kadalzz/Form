import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Download, Users, Trash2 } from 'lucide-react'
import { apiService } from '@/services/api'
import { format } from 'date-fns'

export default function FormResponses() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: formData } = useQuery({
    queryKey: ['form', id],
    queryFn: () => apiService.getForm(id!),
    refetchOnMount: 'always', // Always fetch fresh data when page opens
    staleTime: 0, // Consider data stale immediately
  })

  const { data: responsesData, isLoading } = useQuery({
    queryKey: ['responses', id],
    queryFn: () => apiService.getResponses(id!),
    refetchOnMount: 'always', // Always fetch fresh data when page opens
    staleTime: 0, // Consider data stale immediately
  })

  const deleteResponseMutation = useMutation({
    mutationFn: (responseId: string) => apiService.deleteResponse(responseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responses', id] })
    },
  })

  const handleDeleteResponse = (responseId: string) => {
    if (window.confirm('Are you sure you want to delete this response? This action cannot be undone.')) {
      deleteResponseMutation.mutate(responseId)
    }
  }

  const handleExport = async (type: 'excel' | 'pdf') => {
    try {
      const blob = type === 'excel' 
        ? await apiService.exportToExcel(id!)
        : await apiService.exportToPDF(id!)
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${formData?.data.title || 'form'}_responses.${type === 'excel' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert('Export failed')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const form = formData?.data
  const responses = responsesData?.data || []

  return (
    <div>
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{form?.title}</h1>
            <div className="flex items-center space-x-2 text-gray-600">
              <Users className="w-5 h-5" />
              <span>{responses.length} responses</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {responses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No responses yet</h3>
          <p className="text-gray-600">Responses will appear here once someone fills out your form.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {responses.map((response: any, index: number) => (
            <div key={response.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Response Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-sm font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {response.responderName || response.responder?.name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(response.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteResponse(response.id)}
                  disabled={deleteResponseMutation.isPending}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete response"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
              {/* Response Answers */}
              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {form?.questions.filter((q: any) => q.type !== 'SECTION_HEADER').map((question: any) => {
                  const answer = response.answers.find((a: any) => a.questionId === question.id)
                  const value = answer?.value
                  
                  // Display value with proper formatting
                  let displayValue = '-'
                  if (value !== null && value !== undefined) {
                    if (Array.isArray(value)) {
                      // For CHECKBOX - join all values including custom answers
                      displayValue = value.length > 0 ? value.join(', ') : '-'
                    } else {
                      // For MULTIPLE_CHOICE and text - display as is, including custom answers
                      displayValue = value.toString().trim() || '-'
                    }
                  }
                  
                  return (
                    <div key={question.id} className="border-b border-gray-100 pb-3 last:border-0">
                      <p className="text-xs font-medium text-gray-500 mb-1">{question.title}</p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">{displayValue}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
