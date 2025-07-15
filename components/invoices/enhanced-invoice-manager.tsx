'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  FileText, 
  Download, 
  Mail, 
  Send, 
  Eye, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  Printer,
  Copy
} from 'lucide-react'
import { Invoice, InvoicePayment, InvoiceEmailHistory } from '@/types/invoice'
import { InvoiceTemplate } from '@/types/invoice-template'
import { InvoiceCalculator } from '@/lib/invoice-calculations'
import { useToast } from '@/hooks/use-toast'

interface EnhancedInvoiceManagerProps {
  initialInvoices?: Invoice[]
  onInvoiceCreate?: (invoice: Invoice) => void
  onInvoiceUpdate?: (invoice: Invoice) => void
  onInvoiceDelete?: (invoiceId: string) => void
}

interface InvoiceFilters {
  status: string
  clientId: string
  projectId: string
  search: string
  dateFrom: string
  dateTo: string
}

interface EmailDialogData {
  to: string
  cc: string
  bcc: string
  subject: string
  body: string
  templateId: string
  attachPdf: boolean
}

interface PaymentDialogData {
  amount: number
  date: string
  method: string
  reference: string
  notes: string
}

export function EnhancedInvoiceManager({
  initialInvoices = [],
  onInvoiceCreate,
  onInvoiceUpdate,
  onInvoiceDelete
}: EnhancedInvoiceManagerProps) {
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showReminderDialog, setShowReminderDialog] = useState(false)
  const [emailData, setEmailData] = useState<EmailDialogData>({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    templateId: '',
    attachPdf: true
  })
  const [paymentData, setPaymentData] = useState<PaymentDialogData>({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: 'bank_transfer',
    reference: '',
    notes: ''
  })
  const [filters, setFilters] = useState<InvoiceFilters>({
    status: 'all',
    clientId: 'all',
    projectId: 'all',
    search: '',
    dateFrom: '',
    dateTo: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  // Load invoices and templates
  useEffect(() => {
    loadInvoices()
    loadTemplates()
  }, [filters, currentPage])

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.clientId !== 'all' && { clientId: filters.clientId }),
        ...(filters.projectId !== 'all' && { projectId: filters.projectId }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      })

      const response = await fetch(`/api/invoices?${params}`)
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices)
        setTotalPages(Math.ceil(data.total / itemsPerPage))
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load invoices',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/invoice-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const handleDownloadPDF = async (invoice: Invoice, templateId?: string) => {
    try {
      const params = new URLSearchParams({
        download: 'true',
        ...(templateId && { templateId })
      })
      
      const response = await fetch(`/api/invoices/${invoice.id}/pdf?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoice.invoiceNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: 'Success',
          description: 'Invoice PDF downloaded successfully'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download PDF',
        variant: 'destructive'
      })
    }
  }

  const handleSendEmail = async () => {
    if (!selectedInvoice) return
    
    try {
      const response = await fetch(`/api/invoices/${selectedInvoice.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emailData,
          emailType: 'invoice'
        })
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Invoice email sent successfully'
        })
        setShowEmailDialog(false)
        loadInvoices()
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send email',
        variant: 'destructive'
      })
    }
  }

  const handleSendReminder = async () => {
    if (!selectedInvoice) return
    
    try {
      const response = await fetch(`/api/invoices/${selectedInvoice.id}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emailData,
          reminderType: 'overdue'
        })
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Payment reminder sent successfully'
        })
        setShowReminderDialog(false)
        loadInvoices()
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send reminder',
        variant: 'destructive'
      })
    }
  }

  const handleAddPayment = async () => {
    if (!selectedInvoice) return
    
    try {
      const response = await fetch(`/api/invoices/${selectedInvoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Payment added successfully'
        })
        setShowPaymentDialog(false)
        loadInvoices()
        // Reset payment form
        setPaymentData({
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          method: 'bank_transfer',
          reference: '',
          notes: ''
        })
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add payment',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-500', icon: Edit },
      sent: { color: 'bg-blue-500', icon: Send },
      viewed: { color: 'bg-purple-500', icon: Eye },
      partial: { color: 'bg-yellow-500', icon: Clock },
      paid: { color: 'bg-green-500', icon: CheckCircle },
      overdue: { color: 'bg-red-500', icon: AlertCircle },
      cancelled: { color: 'bg-gray-400', icon: Trash2 }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const openEmailDialog = (invoice: Invoice, isReminder = false) => {
    setSelectedInvoice(invoice)
    setEmailData({
      to: invoice.clientEmail || '',
      cc: '',
      bcc: '',
      subject: isReminder 
        ? `Payment Reminder: Invoice ${invoice.invoiceNumber}` 
        : `Invoice ${invoice.invoiceNumber}`,
      body: '',
      templateId: invoice.templateId || '',
      attachPdf: true
    })
    
    if (isReminder) {
      setShowReminderDialog(true)
    } else {
      setShowEmailDialog(true)
    }
  }

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setPaymentData({
      amount: invoice.amountDue,
      date: new Date().toISOString().split('T')[0],
      method: 'bank_transfer',
      reference: '',
      notes: ''
    })
    setShowPaymentDialog(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Invoice Management</h2>
          <p className="text-muted-foreground">Manage invoices, payments, and communications</p>
        </div>
        <Button onClick={() => onInvoiceCreate?.({} as Invoice)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Invoice number, client..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
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
            
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({
                  status: 'all',
                  clientId: 'all',
                  projectId: 'all',
                  search: '',
                  dateFrom: '',
                  dateTo: ''
                })}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell>
                        {new Date(invoice.issueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {InvoiceCalculator.formatCurrency(invoice.total, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        {InvoiceCalculator.formatCurrency(invoice.amountPaid, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        {InvoiceCalculator.formatCurrency(invoice.amountDue, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadPDF(invoice)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEmailDialog(invoice)}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          
                          {['sent', 'overdue', 'partial'].includes(invoice.status) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEmailDialog(invoice, true)}
                            >
                              <AlertCircle className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {invoice.amountDue > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openPaymentDialog(invoice)}
                            >
                              <DollarSign className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onInvoiceUpdate?.(invoice)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Invoice Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emailTo">To</Label>
                <Input
                  id="emailTo"
                  value={emailData.to}
                  onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="client@example.com"
                />
              </div>
              <div>
                <Label htmlFor="emailTemplate">Template</Label>
                <Select value={emailData.templateId} onValueChange={(value) => setEmailData(prev => ({ ...prev, templateId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="emailSubject">Subject</Label>
              <Input
                id="emailSubject"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="emailBody">Message</Label>
              <Textarea
                id="emailBody"
                value={emailData.body}
                onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
                rows={6}
                placeholder="Optional custom message..."
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="attachPdf"
                checked={emailData.attachPdf}
                onChange={(e) => setEmailData(prev => ({ ...prev, attachPdf: e.target.checked }))}
              />
              <Label htmlFor="attachPdf">Attach PDF</Label>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendEmail}>
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reminder Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reminderTo">To</Label>
                <Input
                  id="reminderTo"
                  value={emailData.to}
                  onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="client@example.com"
                />
              </div>
              <div>
                <Label htmlFor="reminderTemplate">Template</Label>
                <Select value={emailData.templateId} onValueChange={(value) => setEmailData(prev => ({ ...prev, templateId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="reminderSubject">Subject</Label>
              <Input
                id="reminderSubject"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="reminderBody">Message</Label>
              <Textarea
                id="reminderBody"
                value={emailData.body}
                onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
                rows={6}
                placeholder="Optional custom reminder message..."
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReminderDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendReminder}>
                <AlertCircle className="w-4 h-4 mr-2" />
                Send Reminder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentAmount">Amount</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="paymentDate">Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentData.date}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentData.method} onValueChange={(value) => setPaymentData(prev => ({ ...prev, method: value }))}>
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
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="paymentReference">Reference</Label>
              <Input
                id="paymentReference"
                value={paymentData.reference}
                onChange={(e) => setPaymentData(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="Transaction ID, check number, etc."
              />
            </div>
            
            <div>
              <Label htmlFor="paymentNotes">Notes</Label>
              <Textarea
                id="paymentNotes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional payment notes..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPayment}>
                <DollarSign className="w-4 h-4 mr-2" />
                Add Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}