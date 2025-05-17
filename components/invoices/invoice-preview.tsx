"use client"

import { format } from "date-fns"
import { useProjectContext } from "@/contexts/project-context"
import type { Invoice } from "@/types/invoice"

interface InvoicePreviewProps {
  invoice: Invoice
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const { projects } = useProjectContext()
  const project = invoice.projectId ? projects.find((p) => p.id === invoice.projectId) : null

  return (
    <div className="p-6 bg-white rounded-lg">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold">INVOICE</h2>
          <p className="text-gray-500">{invoice.invoiceNumber}</p>
        </div>
        <div className="text-right">
          <p className="font-bold">Your Company Name</p>
          <p>123 Business Street</p>
          <p>City, State ZIP</p>
          <p>contact@yourcompany.com</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-bold mb-2">Bill To:</h3>
          <p className="font-medium">{invoice.recipientInfo.name}</p>
          <p>{invoice.recipientInfo.email}</p>
          {invoice.recipientInfo.address.street && <p>{invoice.recipientInfo.address.street}</p>}
          {(invoice.recipientInfo.address.city || invoice.recipientInfo.address.state) && (
            <p>
              {invoice.recipientInfo.address.city}
              {invoice.recipientInfo.address.city && invoice.recipientInfo.address.state
                ? `, ${invoice.recipientInfo.address.state}`
                : invoice.recipientInfo.address.state}
              {invoice.recipientInfo.address.zipCode && ` ${invoice.recipientInfo.address.zipCode}`}
            </p>
          )}
          {invoice.recipientInfo.address.country && <p>{invoice.recipientInfo.address.country}</p>}
        </div>
        <div className="text-right">
          <div className="mb-2">
            <span className="font-bold">Invoice Date:</span> {format(new Date(invoice.issueDate), "MMMM d, yyyy")}
          </div>
          <div className="mb-2">
            <span className="font-bold">Due Date:</span> {format(new Date(invoice.dueDate), "MMMM d, yyyy")}
          </div>
          {invoice.projectId && (
            <div className="mb-2">
              <span className="font-bold">Project:</span> {project?.name || "N/A"}
            </div>
          )}
        </div>
      </div>

      <table className="w-full mb-8">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-left py-2">Description</th>
            <th className="text-center py-2">Quantity</th>
            <th className="text-right py-2">Rate</th>
            <th className="text-right py-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-2">{item.description}</td>
              <td className="text-center py-2">{item.quantity}</td>
              <td className="text-right py-2">${item.rate.toFixed(2)}</td>
              <td className="text-right py-2">${(item.quantity * item.rate).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-1/3">
          <div className="flex justify-between py-2">
            <span className="font-medium">Subtotal:</span>
            <span>${invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0).toFixed(2)}</span>
          </div>
          {invoice.taxRate > 0 && (
            <div className="flex justify-between py-2">
              <span className="font-medium">Tax ({(invoice.taxRate * 100).toFixed(2)}%):</span>
              <span>
                $
                {(
                  invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0) * invoice.taxRate
                ).toFixed(2)}
              </span>
            </div>
          )}
          {invoice.discount > 0 && (
            <div className="flex justify-between py-2">
              <span className="font-medium">Discount:</span>
              <span>-${invoice.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t border-gray-300 font-bold">
            <span>Total:</span>
            <span>
              $
              {(
                invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0) * (1 + invoice.taxRate) -
                invoice.discount
              ).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="mt-8">
          <h3 className="font-bold mb-2">Notes:</h3>
          <p className="text-gray-700">{invoice.notes}</p>
        </div>
      )}

      <div className="mt-8 text-center text-gray-500">
        <p>Thank you for your business!</p>
        <p className="mt-2">Payment is due by {format(new Date(invoice.dueDate), "MMMM d, yyyy")}</p>
      </div>
    </div>
  )
}
