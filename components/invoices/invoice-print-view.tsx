"use client"

import { useEffect, useRef } from "react"
import { format } from "date-fns"
import type { Invoice } from "@/types/invoice"

interface InvoicePrintViewProps {
  invoice: Invoice
  onRender?: () => void
}

export function InvoicePrintView({ invoice, onRender }: InvoicePrintViewProps) {
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (onRender && printRef.current) {
      onRender()
    }
  }, [onRender])

  return (
    <div ref={printRef} className="p-8 max-w-4xl mx-auto bg-white text-black print:p-0">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">INVOICE</h1>
          <p className="text-xl font-semibold mt-1">{invoice.invoiceNumber}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">Your Company Name</p>
          <p>123 Business Street</p>
          <p>City, State 12345</p>
          <p>contact@yourcompany.com</p>
        </div>
      </div>

      {/* Invoice Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-lg font-semibold mb-2">Bill To:</h2>
          <p className="font-medium">{invoice.recipientInfo.name}</p>
          <p>{invoice.recipientInfo.email}</p>
          {invoice.recipientInfo.address.street && <p>{invoice.recipientInfo.address.street}</p>}
          {invoice.recipientInfo.address.city && (
            <p>
              {invoice.recipientInfo.address.city}
              {invoice.recipientInfo.address.state && `, ${invoice.recipientInfo.address.state}`}{" "}
              {invoice.recipientInfo.address.zipCode}
            </p>
          )}
          {invoice.recipientInfo.address.country && <p>{invoice.recipientInfo.address.country}</p>}
        </div>
        <div className="text-right">
          <div className="mb-4">
            <p className="font-semibold">Invoice Date:</p>
            <p>{format(new Date(invoice.issueDate), "MMMM d, yyyy")}</p>
          </div>
          <div className="mb-4">
            <p className="font-semibold">Due Date:</p>
            <p>{format(new Date(invoice.dueDate), "MMMM d, yyyy")}</p>
          </div>
          {invoice.projectName && (
            <div>
              <p className="font-semibold">Project:</p>
              <p>{invoice.projectName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="py-2 text-left">Description</th>
            <th className="py-2 text-center">Quantity</th>
            <th className="py-2 text-right">Rate</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item, index) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-3">{item.description}</td>
              <td className="py-3 text-center">{item.quantity}</td>
              <td className="py-3 text-right">${item.rate.toFixed(2)}</td>
              <td className="py-3 text-right">${item.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2">
            <span>Subtotal:</span>
            <span>${invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span>Tax ({invoice.taxRate}%):</span>
            <span>${invoice.taxAmount.toFixed(2)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between py-2">
              <span>Discount:</span>
              <span>-${invoice.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 font-bold border-t border-gray-300 mt-2">
            <span>Total:</span>
            <span>${invoice.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes and Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {invoice.notes && (
          <div>
            <h3 className="font-semibold mb-2">Notes:</h3>
            <p>{invoice.notes}</p>
          </div>
        )}
        {invoice.terms && (
          <div>
            <h3 className="font-semibold mb-2">Terms and Conditions:</h3>
            <p>{invoice.terms}</p>
          </div>
        )}
      </div>

      {/* Payment Details */}
      {invoice.paymentMethod && (
        <div className="mt-8 pt-4 border-t border-gray-300">
          <h3 className="font-semibold mb-2">Payment Details:</h3>
          <p>
            Method:{" "}
            {invoice.paymentMethod
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </p>
          {invoice.paymentDetails && <p>{invoice.paymentDetails}</p>}
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>Thank you for your business!</p>
      </div>
    </div>
  )
}
