import axios, { AxiosInstance } from 'axios'

// @ts-ignore
const API_BASE_URL = import.meta.env?.VITE_API_URL || '/api'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor untuk menambahkan token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor untuk handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // ===== AUTH =====
  async register(data: { email: string; password: string; name: string; role?: string }) {
    const response = await this.api.post('/auth/register', data)
    return response.data
  }

  async login(data: { email: string; password: string }) {
    const response = await this.api.post('/auth/login', data)
    return response.data
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me')
    return response.data
  }

  // ===== FORMS =====
  async createForm(data: { title: string; description?: string; headerImage?: string; logoUrl?: string; themeColor?: string }) {
    const response = await this.api.post('/forms', data)
    return response.data
  }

  async getForms() {
    const response = await this.api.get('/forms')
    return response.data
  }

  async getForm(id: string) {
    const response = await this.api.get(`/forms/${id}`)
    return response.data
  }

  async updateForm(id: string, data: Partial<{ title: string; description: string; isPublished: boolean; headerImage: string; logoUrl: string; themeColor: string }>) {
    const response = await this.api.put(`/forms/${id}`, data)
    return response.data
  }

  async deleteForm(id: string) {
    const response = await this.api.delete(`/forms/${id}`)
    return response.data
  }

  async publishForm(id: string, isPublished: boolean) {
    const response = await this.api.patch(`/forms/${id}/publish`, { isPublished })
    return response.data
  }

  // ===== QUESTIONS =====
  async createQuestion(data: {
    formId: string
    title: string
    description?: string
    type: 'SHORT_TEXT' | 'LONG_TEXT' | 'MULTIPLE_CHOICE' | 'CHECKBOX'
    isRequired: boolean
    order: number
    options?: string[]
  }) {
    const response = await this.api.post('/questions', data)
    return response.data
  }

  async getQuestions(formId: string) {
    const response = await this.api.get(`/questions/form/${formId}`)
    return response.data
  }

  async updateQuestion(id: string, data: any) {
    const response = await this.api.put(`/questions/${id}`, data)
    return response.data
  }

  async deleteQuestion(id: string) {
    const response = await this.api.delete(`/questions/${id}`)
    return response.data
  }

  async reorderQuestions(questions: { id: string; order: number }[]) {
    const response = await this.api.patch('/questions/reorder', { questions })
    return response.data
  }

  // ===== RESPONSES =====
  async submitResponse(data: {
    formId: string
    answers: Array<{ questionId: string; value: string | string[] }>
  }) {
    const response = await this.api.post('/responses', data)
    return response.data
  }

  async getResponses(formId: string) {
    const response = await this.api.get(`/responses/form/${formId}`)
    return response.data
  }

  async getResponse(id: string) {
    const response = await this.api.get(`/responses/${id}`)
    return response.data
  }

  async deleteResponse(id: string) {
    const response = await this.api.delete(`/responses/${id}`)
    return response.data
  }

  async getResponseStats(formId: string) {
    const response = await this.api.get(`/responses/form/${formId}/stats`)
    return response.data
  }

  // ===== EXPORT =====
  async exportToExcel(formId: string) {
    const response = await this.api.get(`/export/excel/${formId}`, {
      responseType: 'blob',
    })
    return response.data
  }

  async exportToPDF(formId: string) {
    const response = await this.api.get(`/export/pdf/${formId}`, {
      responseType: 'blob',
    })
    return response.data
  }
}

export const apiService = new ApiService()
