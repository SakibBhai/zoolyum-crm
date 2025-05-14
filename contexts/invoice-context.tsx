"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Invoice, InvoiceFormData, InvoiceStatus } from "@/types/invoice"
import { invoices as initialInvoices } from "@/data/invoices"
import { v4 as uuidv4 } from "uuid"

interface InvoiceContextType {
  invoices: Invoice[]
  getInvoice: (id: string) => Invoice | undefined
  getClientInvoices: (clientId: string) => Invoice[]
  getProjectInvoices: (projectId: string) => Invoice[]
  createInvoice: (data: InvoiceFormData) => Invoice
  updateInvoice: (id: string, data: Partial<Invoice>) => Invoice | undefined
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Invoice | undefined
  deleteInvoice: (id: string) => void
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined)

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)

  const getInvoice = (id: string) => {
    return invoices.find((invoice) => invoice.id === id)
  }

  const getClientInvoices = (clientId: string) => {
    return invoices.filter((invoice) => invoice.clientId === clientId)
  }

  const getProjectInvoices = (projectId: string) => {
    return invoices.filter((invoice) => invoice.projectId === projectId)
  }

  const createInvoice = (data: InvoiceFormData) => {
    // Generate a new invoice number based on the current date and number of invoices
    const date = new Date()
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const invoiceCount = invoices.length + 1
    const invoiceNumber = `INV-${year}${month}-${invoiceCount.toString().padStart(3, "0")}`

    // Calculate subtotal, tax amount, and total
    const subtotal = data.lineItems.reduce((sum, item) => sum + item.amount, 0)
    const taxAmount = (subtotal * data.taxRate) / 100
    const total = subtotal + taxAmount - data.discount

    const newInvoice: Invoice = {
      id: uuidv4(),
      invoiceNumber,
      clientId: data.clientId,
      clientName: data.recipientInfo.name,
      recipientInfo: data.recipientInfo,
      projectId: data.projectId,
      projectName: data.projectId ? "Project Name" : undefined, // This would be fetched from project data
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      status: "draft",
      subtotal,
      taxRate: data.taxRate,
      taxAmount,
      discount: data.discount,
      total,
      notes: data.notes,
      terms: data.terms,
      lineItems: data.lineItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentMethod: data.paymentMethod,
      paymentDetails: data.paymentDetails,
    }

    setInvoices((prev) => [...prev, newInvoice])
    return newInvoice
  }

  const updateInvoice = (id: string, data: Partial<Invoice>) => {
    const invoiceIndex = invoices.findIndex((invoice) => invoice.id === id)
    if (invoiceIndex === -1) return undefined

    // Calculate new financial values if line items, tax rate, or discount changed
    let updatedInvoice = { ...invoices[invoiceIndex], ...data }

    if (data.lineItems || data.taxRate !== undefined || data.discount !== undefined) {
      const subtotal = (data.lineItems || updatedInvoice.lineItems).reduce((sum, item) => sum + item.amount, 0)
      const taxRate = data.taxRate !== undefined ? data.taxRate : updatedInvoice.taxRate
      const discount = data.discount !== undefined ? data.discount : updatedInvoice.discount
      const taxAmount = (subtotal * taxRate) / 100
      const total = subtotal + taxAmount - discount

      updatedInvoice = {
        ...updatedInvoice,
        subtotal,
        taxRate,
        taxAmount,
        discount,
        total,
        updatedAt: new Date().toISOString(),
      }
    }

    const updatedInvoices = [...invoices]
    updatedInvoices[invoiceIndex] = updatedInvoice

    setInvoices(updatedInvoices)
    return updatedInvoice
  }

  const updateInvoiceStatus = (id: string, status: InvoiceStatus) => {
    return updateInvoice(id, { status, updatedAt: new Date().toISOString() })
  }

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((invoice) => invoice.id !== id))
  }

  return (
    <InvoiceContext.Provider
      value={{
        invoices,
        getInvoice,
        getClientInvoices,
        getProjectInvoices,
        createInvoice,
        updateInvoice,
        updateInvoiceStatus,
        deleteInvoice,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  )
}

export const useInvoiceContext = () => {
  const context = useContext(InvoiceContext)
  if (context === undefined) {
    throw new Error("useInvoiceContext must be used within an InvoiceProvider")
  }
  return context
}
