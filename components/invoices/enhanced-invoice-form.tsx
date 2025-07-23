'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Plus,
  Trash2,
  Save,
  Send,
  Eye,
  Calculator,
  FileText,
  Settings,
  DollarSign,
  Percent,
  Package
} from 'lucide-react'
import { Invoice, LineItem } from '@/types/invoice'
import { InvoiceTemplate } from '@/types/invoice-template'
import { InvoiceCalculator } from '@/lib/invoice-calculations'
import { useToast } from '@/hooks/use-toast'

interface EnhancedInvoiceFormProps {
  invoice?: Invoice
  onSave?: (invoice: Invoice) => void
  onCancel?: () => void
  mode?: 'create' | 'edit'
}

interface Client {
  id: string
  name: string
  email: string
  address?: string
  phone?: string
}

interface Project {
  id: string
  name: string
  clientId: string
}

export function EnhancedInvoiceForm({
  invoice,
  onSave,
  onCancel,
  mode = 'create'
}: EnhancedInvoiceFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [dueDays, setDueDays] = useState(30)
  const [formData, setFormData] = useState<Partial<Invoice>>({
    invoiceNumber: '',
    clientId: '',
    projectId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'draft',
    lineItems: [],
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    discountRate: 0,
    discountAmount: 0,
    discountType: 'percentage',
    shippingAmount: 0,
    shippingTaxRate: 0,
    shippingTaxAmount: 0,
    total: 0,
    notes: '',
    terms: 'Payment is due within 30 days of invoice date.',
    paymentMethod: 'bank_transfer',
    templateId: '',
    currency: 'USD',
    currencySymbol: '$',
    exchangeRate: 1,
    poNumber: '',
    ...invoice
  })
  const [calculations, setCalculations] = useState(InvoiceCalculator.calculateInvoice(formData as Invoice))

  useEffect(() => {
    loadClients()
    loadProjects()
    loadTemplates()

    // Generate invoice number if creating new invoice
    if (mode === 'create' && !formData.invoiceNumber) {
      generateInvoiceNumber()
    }
  }, [])

  useEffect(() => {
    // Recalculate when form data changes
    const newCalculations = InvoiceCalculator.calculateInvoice(formData as Invoice)
    setCalculations(newCalculations)
    setFormData(prev => ({
      ...prev,
      subtotal: newCalculations.subtotal,
      taxAmount: newCalculations.totalTax,
      discountAmount: newCalculations.totalDiscount,
      shippingTaxAmount: newCalculations.shippingTax,
      total: newCalculations.total,
      amountPaid: 0,
      amountDue: newCalculations.total
    }))
  }, [formData.lineItems, formData.taxRate, formData.discountRate, formData.discountType, formData.shippingAmount, formData.shippingTaxRate])

  useEffect(() => {
    // Calculate due date when issue date or due days change
    if (formData.issueDate && dueDays) {
      const dueDate = InvoiceCalculator.calculateDueDate(formData.issueDate, dueDays)
      setFormData(prev => ({ ...prev, dueDate }))
    }
  }, [formData.issueDate, dueDays])

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Failed to load clients:', error)
    }
  }

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/invoice-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)

        // Set default template if none selected
        if (!formData.templateId && data.length > 0) {
          const defaultTemplate = data.find((t: InvoiceTemplate) => t.isDefault) || data[0]
          setFormData(prev => ({ ...prev, templateId: defaultTemplate.id }))
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const generateInvoiceNumber = async () => {
    try {
      const invoiceNumber = InvoiceCalculator.generateInvoiceNumber()
      setFormData(prev => ({ ...prev, invoiceNumber }))
    } catch (error) {
      console.error('Failed to generate invoice number:', error)
    }
  }

  const addLineItem = () => {
    const newLineItem: LineItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      unit: 'hours',
      taxRate: 0,
      taxAmount: 0,
      discountRate: 0,
      discountAmount: 0,
      discountType: 'percentage',
      projectId: formData.projectId,
      taskId: '',
      category: '',
      startDate: '',
      endDate: '',
      notes: ''
    }

    setFormData(prev => ({
      ...prev,
      lineItems: [...(prev.lineItems || []), newLineItem]
    }))
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updatedLineItems = [...(formData.lineItems || [])]
    const lineItem = { ...updatedLineItems[index] }

    lineItem[field] = value as never

    // Recalculate line item amount
    const lineCalculations = InvoiceCalculator.calculateLineItem(lineItem)
    lineItem.amount = lineCalculations.total
    lineItem.taxAmount = lineCalculations.tax
    lineItem.discountAmount = lineCalculations.discount

    updatedLineItems[index] = lineItem
    setFormData(prev => ({ ...prev, lineItems: updatedLineItems }))
  }

  const removeLineItem = (index: number) => {
    const updatedLineItems = [...(formData.lineItems || [])]
    updatedLineItems.splice(index, 1)
    setFormData(prev => ({ ...prev, lineItems: updatedLineItems }))
  }

  const handleSave = async (status?: string) => {
    setLoading(true)
    try {
      const invoiceData = {
        ...formData,
        status: status || formData.status
      }

      const url = mode === 'create' ? '/api/invoices' : `/api/invoices/${invoice?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      })

      if (response.ok) {
        const savedInvoice = await response.json()
        toast({
          title: 'Success',
          description: `Invoice ${mode === 'create' ? 'created' : 'updated'} successfully`
        })
        onSave?.(savedInvoice)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save invoice')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save invoice',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedClient = clients.find(c => c.id === formData.clientId)
  const filteredProjects = projects.filter(p => p.clientId === formData.clientId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            {mode === 'create' ? 'Create Invoice' : 'Edit Invoice'}
          </h2>
          <p className="text-muted-foreground">
            {mode === 'create' ? 'Create a new invoice' : `Editing invoice ${formData.invoiceNumber}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => handleSave('draft')} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={() => handleSave('sent')} disabled={loading}>
            <Send className="w-4 h-4 mr-2" />
            Save & Send
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    placeholder="INV-001"
                  />
                </div>

                <div>
                  <Label htmlFor="poNumber">PO Number</Label>
                  <Input
                    id="poNumber"
                    value={formData.poNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                    placeholder="Optional purchase order number"
                  />
                </div>

                <div>
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="dueDays">Due Days</Label>
                  <Select
                    value={dueDays.toString()}
                    onValueChange={(value) => setDueDays(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Due on receipt</SelectItem>
                      <SelectItem value="15">Net 15</SelectItem>
                      <SelectItem value="30">Net 30</SelectItem>
                      <SelectItem value="45">Net 45</SelectItem>
                      <SelectItem value="60">Net 60</SelectItem>
                      <SelectItem value="90">Net 90</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      currency: value,
                      currencySymbol: value === 'USD' ? '$' : value === 'EUR' ? '€' : value === 'GBP' ? '£' : '$'
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="AUD">AUD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientId">Client</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value, projectId: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="projectId">Project (Optional)</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
                    disabled={!formData.clientId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No project</SelectItem>
                      {filteredProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="templateId">Invoice Template</Label>
                <Select
                  value={formData.templateId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, templateId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} {template.isDefault && '(Default)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Line Items
                </CardTitle>
                <Button onClick={addLineItem} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.lineItems && formData.lineItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Tax %</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.lineItems.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Input
                              value={item.description}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              placeholder="Item description"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.unit}
                              onValueChange={(value) => updateLineItem(index, 'unit', value)}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hours">Hours</SelectItem>
                                <SelectItem value="days">Days</SelectItem>
                                <SelectItem value="items">Items</SelectItem>
                                <SelectItem value="pieces">Pieces</SelectItem>
                                <SelectItem value="each">Each</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.taxRate}
                              onChange={(e) => updateLineItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {InvoiceCalculator.formatCurrency(item.amount, formData.currency)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLineItem(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No line items added yet. Click "Add Item" to get started.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Additional Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, discountType: value as 'percentage' | 'fixed' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="discountRate">
                    Discount {formData.discountType === 'percentage' ? '(%)' : `(${formData.currencySymbol})`}
                  </Label>
                  <Input
                    id="discountRate"
                    type="number"
                    step="0.01"
                    value={formData.discountRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountRate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shippingAmount">Shipping Amount</Label>
                  <Input
                    id="shippingAmount"
                    type="number"
                    step="0.01"
                    value={formData.shippingAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, shippingAmount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="shippingTaxRate">Shipping Tax Rate (%)</Label>
                  <Input
                    id="shippingTaxRate"
                    type="number"
                    step="0.01"
                    value={formData.shippingTaxRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, shippingTaxRate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes for the client..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                  placeholder="Payment terms and conditions..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          {selectedClient && (
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="font-medium">{selectedClient.name}</p>
                    {selectedClient.email && (
                      <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                    )}
                    {selectedClient.address && (
                      <p className="text-sm text-muted-foreground">{selectedClient.address}</p>
                    )}
                    {selectedClient.phone && (
                      <p className="text-sm text-muted-foreground">{selectedClient.phone}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{InvoiceCalculator.formatCurrency(calculations.subtotal, formData.currency)}</span>
                </div>

                {calculations.totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{InvoiceCalculator.formatCurrency(calculations.totalDiscount, formData.currency)}</span>
                  </div>
                )}

                {calculations.totalTax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{InvoiceCalculator.formatCurrency(calculations.totalTax, formData.currency)}</span>
                  </div>
                )}

                {calculations.shippingAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>{InvoiceCalculator.formatCurrency(calculations.shippingAmount, formData.currency)}</span>
                  </div>
                )}

                {calculations.shippingTax > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping Tax:</span>
                    <span>{InvoiceCalculator.formatCurrency(calculations.shippingTax, formData.currency)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{InvoiceCalculator.formatCurrency(calculations.total, formData.currency)}</span>
                </div>

                {formData.amountPaid && formData.amountPaid > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Amount Paid:</span>
                      <span>{InvoiceCalculator.formatCurrency(formData.amountPaid, formData.currency)}</span>
                    </div>

                    <div className="flex justify-between font-medium">
                      <span>Amount Due:</span>
                      <span>{InvoiceCalculator.formatCurrency((formData.amountDue || 0), formData.currency)}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="status">Invoice Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Invoice['status'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="viewed">Viewed</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Badge
                  className={`w-full justify-center ${formData.status === 'paid' ? 'bg-green-500' :
                      formData.status === 'overdue' ? 'bg-red-500' :
                        formData.status === 'sent' ? 'bg-blue-500' :
                          'bg-gray-500'
                    }`}
                >
                  {formData.status ? (formData.status.charAt(0).toUpperCase() + formData.status.slice(1)) : 'Draft'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}