"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { RecurringInvoiceTemplate, RecurringInvoiceFormData } from "@/types/recurring-invoice"
import { recurringInvoices as initialRecurringInvoices } from "@/data/recurring-invoices"
import { useInvoiceContext } from "@/contexts/invoice-context"
import { v4 as uuidv4 } from "uuid"
import { addDays, addWeeks, addMonths, format, parseISO } from "date-fns"

interface RecurringInvoiceContextType {
  recurringInvoices: RecurringInvoiceTemplate[]
  getRecurringInvoice: (id: string) => RecurringInvoiceTemplate | undefined
  getClientRecurringInvoices: (clientId: string) => RecurringInvoiceTemplate[]
  getProjectRecurringInvoices: (projectId: string) => RecurringInvoiceTemplate[]
  createRecurringInvoice: (data: RecurringInvoiceFormData) => RecurringInvoiceTemplate
  updateRecurringInvoice: (id: string, data: Partial<RecurringInvoiceTemplate>) => RecurringInvoiceTemplate | undefined
  toggleRecurringInvoiceStatus: (id: string) => RecurringInvoiceTemplate | undefined
  deleteRecurringInvoice: (id: string) => void
  generateInvoiceFromTemplate: (templateId: string) => void
  checkAndGenerateScheduledInvoices: () => void
}

const RecurringInvoiceContext = createContext<RecurringInvoiceContextType | undefined>(undefined)

export function RecurringInvoiceProvider({ children }: { children: ReactNode }) {
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoiceTemplate[]>(initialRecurringInvoices)
  const { createInvoice } = useInvoiceContext()

  const getRecurringInvoice = (id: string) => {
    return recurringInvoices.find((template) => template.id === id)
  }

  const getClientRecurringInvoices = (clientId: string) => {
    return recurringInvoices.filter((template) => template.clientId === clientId)
  }

  const getProjectRecurringInvoices = (projectId: string) => {
    return recurringInvoices.filter((template) => template.projectId === projectId)
  }

  // Calculate the next generation date based on recurrence interval
  const calculateNextGenerationDate = (startDate: string, recurrenceInterval: string, customDays?: number): string => {
    const date = parseISO(startDate)
    let nextDate

    switch (recurrenceInterval) {
      case "weekly":
        nextDate = addWeeks(date, 1)
        break
      case "monthly":
        nextDate = addMonths(date, 1)
        break
      case "quarterly":
        nextDate = addMonths(date, 3)
        break
      case "yearly":
        nextDate = addMonths(date, 12)
        break
      case "custom":
        nextDate = addDays(date, customDays || 30) // Default to 30 days if not specified
        break
      default:
        nextDate = addMonths(date, 1) // Default to monthly
    }

    return format(nextDate, "yyyy-MM-dd")
  }

  const createRecurringInvoice = (data: RecurringInvoiceFormData) => {
    const nextGenerationDate = calculateNextGenerationDate(data.startDate, data.recurrenceInterval, data.customDays)

    const newTemplate: RecurringInvoiceTemplate = {
      id: uuidv4(),
      name: data.name,
      clientId: data.clientId,
      clientName: "Client Name", // This would be fetched from client data in a real app
      projectId: data.projectId,
      projectName: data.projectId ? "Project Name" : undefined, // This would be fetched from project data
      description: data.description,
      active: true,
      recurrenceInterval: data.recurrenceInterval,
      customDays: data.customDays,
      nextGenerationDate,
      endDate: data.endDate,
      taxRate: data.taxRate,
      discount: data.discount,
      notes: data.notes,
      lineItems: data.lineItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setRecurringInvoices((prev) => [...prev, newTemplate])
    return newTemplate
  }

  const updateRecurringInvoice = (id: string, data: Partial<RecurringInvoiceTemplate>) => {
    const templateIndex = recurringInvoices.findIndex((template) => template.id === id)
    if (templateIndex === -1) return undefined

    // Calculate new next generation date if recurrence interval changed
    const updatedTemplate = { ...recurringInvoices[templateIndex], ...data }

    if (data.recurrenceInterval || data.customDays) {
      updatedTemplate.nextGenerationDate = calculateNextGenerationDate(
        data.nextGenerationDate || updatedTemplate.nextGenerationDate,
        data.recurrenceInterval || updatedTemplate.recurrenceInterval,
        data.customDays || updatedTemplate.customDays,
      )
    }

    updatedTemplate.updatedAt = new Date().toISOString()

    const updatedTemplates = [...recurringInvoices]
    updatedTemplates[templateIndex] = updatedTemplate

    setRecurringInvoices(updatedTemplates)
    return updatedTemplate
  }

  const toggleRecurringInvoiceStatus = (id: string) => {
    const template = getRecurringInvoice(id)
    if (!template) return undefined

    return updateRecurringInvoice(id, {
      active: !template.active,
      updatedAt: new Date().toISOString(),
    })
  }

  const deleteRecurringInvoice = (id: string) => {
    setRecurringInvoices((prev) => prev.filter((template) => template.id !== id))
  }

  const generateInvoiceFromTemplate = (templateId: string) => {
    const template = getRecurringInvoice(templateId)
    if (!template) return

    // Create invoice from template
    const invoiceData = {
      clientId: template.clientId,
      projectId: template.projectId,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: calculateNextGenerationDate(new Date().toISOString().split("T")[0], "monthly"), // Due in 30 days
      lineItems: template.lineItems,
      taxRate: template.taxRate,
      discount: template.discount,
      notes: template.notes,
    }

    // Create the invoice
    createInvoice(invoiceData)

    // Update the template with new generation dates
    const today = new Date().toISOString().split("T")[0]
    const nextGenerationDate = calculateNextGenerationDate(today, template.recurrenceInterval, template.customDays)

    updateRecurringInvoice(templateId, {
      lastGeneratedDate: today,
      nextGenerationDate,
    })
  }

  // Check for templates that need to generate invoices
  const checkAndGenerateScheduledInvoices = () => {
    const today = new Date().toISOString().split("T")[0]

    recurringInvoices.forEach((template) => {
      if (template.active && template.nextGenerationDate <= today) {
        // Check if we've passed the end date
        if (template.endDate && today > template.endDate) {
          // Deactivate the template
          updateRecurringInvoice(template.id, { active: false })
          return
        }

        // Generate invoice
        generateInvoiceFromTemplate(template.id)
      }
    })
  }

  return (
    <RecurringInvoiceContext.Provider
      value={{
        recurringInvoices,
        getRecurringInvoice,
        getClientRecurringInvoices,
        getProjectRecurringInvoices,
        createRecurringInvoice,
        updateRecurringInvoice,
        toggleRecurringInvoiceStatus,
        deleteRecurringInvoice,
        generateInvoiceFromTemplate,
        checkAndGenerateScheduledInvoices,
      }}
    >
      {children}
    </RecurringInvoiceContext.Provider>
  )
}

export const useRecurringInvoiceContext = () => {
  const context = useContext(RecurringInvoiceContext)
  if (context === undefined) {
    throw new Error("useRecurringInvoiceContext must be used within a RecurringInvoiceProvider")
  }
  return context
}
