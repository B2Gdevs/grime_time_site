'use client'

export type ValidationIssue = {
  blockIndex: null | number
  id: string
  message: string
  tone: 'default' | 'warning'
}

export type ValidationSummary = {
  issues: ValidationIssue[]
  pageStatus: 'draft' | 'published'
}
