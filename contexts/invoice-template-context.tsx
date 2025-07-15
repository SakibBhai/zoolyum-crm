'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { InvoiceTemplate, InvoiceTemplateFormData, DEFAULT_INVOICE_TEMPLATE } from '@/types/invoice-template'

interface InvoiceTemplateState {
  templates: InvoiceTemplate[]
  activeTemplate: InvoiceTemplate | null
  loading: boolean
  error: string | null
}

type InvoiceTemplateAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TEMPLATES'; payload: InvoiceTemplate[] }
  | { type: 'SET_ACTIVE_TEMPLATE'; payload: InvoiceTemplate }
  | { type: 'ADD_TEMPLATE'; payload: InvoiceTemplate }
  | { type: 'UPDATE_TEMPLATE'; payload: InvoiceTemplate }
  | { type: 'DELETE_TEMPLATE'; payload: string }

interface InvoiceTemplateContextType {
  state: InvoiceTemplateState
  actions: {
    loadTemplates: () => Promise<void>
    createTemplate: (data: InvoiceTemplateFormData) => Promise<InvoiceTemplate>
    updateTemplate: (id: string, data: Partial<InvoiceTemplateFormData>) => Promise<InvoiceTemplate>
    deleteTemplate: (id: string) => Promise<void>
    setActiveTemplate: (template: InvoiceTemplate) => void
    duplicateTemplate: (id: string, newName: string) => Promise<InvoiceTemplate>
    setDefaultTemplate: (id: string) => Promise<void>
  }
}

const InvoiceTemplateContext = createContext<InvoiceTemplateContextType | undefined>(undefined)

function invoiceTemplateReducer(state: InvoiceTemplateState, action: InvoiceTemplateAction): InvoiceTemplateState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    
    case 'SET_TEMPLATES':
      return { 
        ...state, 
        templates: action.payload, 
        loading: false,
        activeTemplate: state.activeTemplate || action.payload.find(t => t.isDefault) || action.payload[0] || null
      }
    
    case 'SET_ACTIVE_TEMPLATE':
      return { ...state, activeTemplate: action.payload }
    
    case 'ADD_TEMPLATE':
      return { 
        ...state, 
        templates: [...state.templates, action.payload],
        activeTemplate: action.payload
      }
    
    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map(t => t.id === action.payload.id ? action.payload : t),
        activeTemplate: state.activeTemplate?.id === action.payload.id ? action.payload : state.activeTemplate
      }
    
    case 'DELETE_TEMPLATE':
      const filteredTemplates = state.templates.filter(t => t.id !== action.payload)
      return {
        ...state,
        templates: filteredTemplates,
        activeTemplate: state.activeTemplate?.id === action.payload 
          ? filteredTemplates.find(t => t.isDefault) || filteredTemplates[0] || null
          : state.activeTemplate
      }
    
    default:
      return state
  }
}

const initialState: InvoiceTemplateState = {
  templates: [],
  activeTemplate: null,
  loading: false,
  error: null
}

export function InvoiceTemplateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(invoiceTemplateReducer, initialState)

  const loadTemplates = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await fetch('/api/invoice-templates')
      if (!response.ok) {
        throw new Error('Failed to load templates')
      }
      const templates = await response.json()
      dispatch({ type: 'SET_TEMPLATES', payload: templates })
    } catch (error) {
      console.error('Error loading templates:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load templates' })
      
      // Fallback to default template
      const defaultTemplate: InvoiceTemplate = {
        ...DEFAULT_INVOICE_TEMPLATE,
        id: 'default',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      }
      dispatch({ type: 'SET_TEMPLATES', payload: [defaultTemplate] })
    }
  }

  const createTemplate = async (data: InvoiceTemplateFormData): Promise<InvoiceTemplate> => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await fetch('/api/invoice-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create template')
      }
      
      const template = await response.json()
      dispatch({ type: 'ADD_TEMPLATE', payload: template })
      return template
    } catch (error) {
      console.error('Error creating template:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create template' })
      throw error
    }
  }

  const updateTemplate = async (id: string, data: Partial<InvoiceTemplateFormData>): Promise<InvoiceTemplate> => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await fetch(`/api/invoice-templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update template')
      }
      
      const template = await response.json()
      dispatch({ type: 'UPDATE_TEMPLATE', payload: template })
      return template
    } catch (error) {
      console.error('Error updating template:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update template' })
      throw error
    }
  }

  const deleteTemplate = async (id: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await fetch(`/api/invoice-templates/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete template')
      }
      
      dispatch({ type: 'DELETE_TEMPLATE', payload: id })
    } catch (error) {
      console.error('Error deleting template:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete template' })
      throw error
    }
  }

  const setActiveTemplate = (template: InvoiceTemplate) => {
    dispatch({ type: 'SET_ACTIVE_TEMPLATE', payload: template })
  }

  const duplicateTemplate = async (id: string, newName: string): Promise<InvoiceTemplate> => {
    const templateToDuplicate = state.templates.find(t => t.id === id)
    if (!templateToDuplicate) {
      throw new Error('Template not found')
    }

    const duplicateData: InvoiceTemplateFormData = {
      name: newName,
      description: `Copy of ${templateToDuplicate.description || templateToDuplicate.name}`,
      design: { ...templateToDuplicate.design },
      branding: { ...templateToDuplicate.branding },
      settings: { ...templateToDuplicate.settings },
      emailSettings: { ...templateToDuplicate.emailSettings }
    }

    return createTemplate(duplicateData)
  }

  const setDefaultTemplate = async (id: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await fetch(`/api/invoice-templates/${id}/set-default`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to set default template')
      }
      
      // Reload templates to get updated default status
      await loadTemplates()
    } catch (error) {
      console.error('Error setting default template:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to set default template' })
      throw error
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const contextValue: InvoiceTemplateContextType = {
    state,
    actions: {
      loadTemplates,
      createTemplate,
      updateTemplate,
      deleteTemplate,
      setActiveTemplate,
      duplicateTemplate,
      setDefaultTemplate
    }
  }

  return (
    <InvoiceTemplateContext.Provider value={contextValue}>
      {children}
    </InvoiceTemplateContext.Provider>
  )
}

export function useInvoiceTemplate() {
  const context = useContext(InvoiceTemplateContext)
  if (context === undefined) {
    throw new Error('useInvoiceTemplate must be used within an InvoiceTemplateProvider')
  }
  return context
}

export default InvoiceTemplateContext