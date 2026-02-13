import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, BarChart, Copy, Eye, EyeOff, FileText } from 'lucide-react'
import { apiService } from '@/services/api'
import { format } from 'date-fns'

export default function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: formsData, isLoading } = useQuery({
    queryKey: ['forms'],
    queryFn: () => apiService.getForms(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
    },
  })

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      apiService.publishForm(id, isPublished),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
    },
  })

  const forms = formsData?.data || []

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleCopyLink = (id: string) => {
    const link = `${window.location.origin}/form/${id}`
    navigator.clipboard.writeText(link)
    alert('Form link copied to clipboard!')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Forms</h1>
          <p className="text-gray-600 mt-1">Create and manage your forms</p>
        </div>
        <button
          onClick={() => navigate('/create')}
          className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Form</span>
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No forms yet</h3>
          <p className="text-gray-600 mb-6">Create your first form to get started</p>
          <button
            onClick={() => navigate('/create')}
            className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Form</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form: any) => (
            <div key={form.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{form.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{form.description || 'No description'}</p>
                </div>
                <button
                  onClick={() => publishMutation.mutate({ id: form.id, isPublished: !form.isPublished })}
                  className={`ml-2 p-2 rounded-lg transition-colors ${
                    form.isPublished
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={form.isPublished ? 'Published' : 'Draft'}
                >
                  {form.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{form._count.responses} responses</span>
                <span>{format(new Date(form.createdAt), 'MMM dd, yyyy')}</span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/form/${form.id}/edit`)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => navigate(`/form/${form.id}/responses`)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <BarChart className="w-4 h-4" />
                  <span>Responses</span>
                </button>
                <button
                  onClick={() => handleCopyLink(form.id)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Copy form link"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(form.id, form.title)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  title="Delete form"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
