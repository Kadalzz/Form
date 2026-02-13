export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'USER'
  createdAt: Date
}

export interface Form {
  id: string
  title: string
  description?: string
  isPublished: boolean
  createdById: string
  createdAt: Date
  updatedAt: Date
  questions?: Question[]
  responses?: Response[]
  _count?: {
    responses: number
  }
}

export type QuestionType = 'SHORT_TEXT' | 'LONG_TEXT' | 'MULTIPLE_CHOICE' | 'CHECKBOX'

export interface Question {
  id: string
  formId: string
  title: string
  description?: string
  type: QuestionType
  isRequired: boolean
  order: number
  options?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Response {
  id: string
  formId: string
  responderId?: string
  responder?: {
    id: string
    name: string
    email: string
  }
  answers: Answer[]
  createdAt: Date
  updatedAt: Date
}

export interface Answer {
  id: string
  responseId: string
  questionId: string
  question?: Question
  value: string | string[]
  createdAt: Date
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: boolean
  details?: any
}
