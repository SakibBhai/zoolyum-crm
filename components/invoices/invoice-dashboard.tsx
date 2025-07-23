'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  Edit,
  DollarSign,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Calendar,
  Users,
  Settings
} from 'lucide-react'
import { Invoice } from '@/types/invoice'
import { InvoiceCalculator } from '@/lib/invoice-calculations'
import { EnhancedInvoiceManager } from './enhanced-invoice-manager'
import { EnhancedInvoiceForm } from './enhanced-invoice-form'
import { useToast } from '@/hooks/use-toast'

interface InvoiceDashboardProps {
  className?: string
}

interface DashboardStats {
  totalInvoices: number
  totalRevenue: number
  paidAmount: number
  pendingAmount: number
  overdueAmount: number
  draftCount: number
  sentCount: number
  paidCount: number
  overdueCount: number
  averageInvoiceValue: number
  paymentRate: number
}

export function InvoiceDashboard({ className }: InvoiceDashboardProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalRevenue: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    draftCount: 0,
    sentCount: 0,
    paidCount: 0,
    overdueCount: 0,
    averageInvoiceValue: 0,
    paymentRate: 0
  })
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    loadDashboardData()
  }, [refreshTrigger])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load recent invoices
      const invoicesResponse = await fetch('/api/invoices?limit=10&sort=created_at&order=desc')
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json()
        setRecentInvoices(invoicesData.invoices || [])

        // Calculate stats from all invoices
        const allInvoicesResponse = await fetch('/api/invoices?limit=1000')
        if (allInvoicesResponse.ok) {
          const allInvoicesData = await allInvoicesResponse.json()
          const allInvoices = allInvoicesData.invoices || []
          calculateStats(allInvoices)
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (invoices: Invoice[]) => {
    const stats: DashboardStats = {
      totalInvoices: invoices.length,
      totalRevenue: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      draftCount: 0,
      sentCount: 0,
      paidCount: 0,
      overdueCount: 0,
      averageInvoiceValue: 0,
      paymentRate: 0
    }

    invoices.forEach(invoice => {
      const calculations = InvoiceCalculator.calculateInvoice(invoice)

      stats.totalRevenue += calculations.total
      stats.paidAmount += invoice.amountPaid || 0

      switch (invoice.status) {
        case 'draft':
          stats.draftCount++
          break
        case 'sent':
        case 'viewed':
          stats.sentCount++
          stats.pendingAmount += invoice.amountDue || 0
          break
        case 'paid':
          stats.paidCount++
          break
        case 'partial':
          stats.sentCount++
          stats.pendingAmount += invoice.amountDue || 0
          break
        case 'overdue':
          stats.overdueCount++
          stats.overdueAmount += invoice.amountDue || 0
          break
      }
    })

    stats.averageInvoiceValue = stats.totalInvoices > 0 ? stats.totalRevenue / stats.totalInvoices : 0
    stats.paymentRate = stats.totalRevenue > 0 ? (stats.paidAmount / stats.totalRevenue) * 100 : 0

    setStats(stats)
  }

  const handleCreateInvoice = () => {
    setEditingInvoice(null)
    setShowCreateForm(true)
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setShowCreateForm(true)
  }

  const handleSaveInvoice = (invoice: Invoice) => {
    setShowCreateForm(false)
    setEditingInvoice(null)
    setRefreshTrigger(prev => prev + 1)
    toast({
      title: 'Success',
      description: `Invoice ${editingInvoice ? 'updated' : 'created'} successfully`
    })
  }

  const handleCancelForm = () => {
    setShowCreateForm(false)
    setEditingInvoice(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500'
      case 'overdue': return 'bg-red-500'
      case 'sent': case 'viewed': return 'bg-blue-500'
      case 'partial': return 'bg-yellow-500'
      case 'draft': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  if (showCreateForm) {
    return (
      <div className={className}>
        <EnhancedInvoiceForm
          invoice={editingInvoice || undefined}
          mode={editingInvoice ? 'edit' : 'create'}
          onSave={handleSaveInvoice}
          onCancel={handleCancelForm}
        />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoice Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your invoices, track payments, and monitor revenue
          </p>
        </div>
        <Button onClick={handleCreateInvoice}>
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">All Invoices</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {InvoiceCalculator.formatCurrency(stats.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {stats.totalInvoices} invoices
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {InvoiceCalculator.formatCurrency(stats.paidAmount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.paymentRate.toFixed(1)}% payment rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {InvoiceCalculator.formatCurrency(stats.pendingAmount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.sentCount} invoices sent
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {InvoiceCalculator.formatCurrency(stats.overdueAmount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.overdueCount} overdue invoices
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      <span>Draft</span>
                    </div>
                    <Badge variant="secondary">{stats.draftCount}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>Sent</span>
                    </div>
                    <Badge className="bg-blue-500">{stats.sentCount}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Paid</span>
                    </div>
                    <Badge className="bg-green-500">{stats.paidCount}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>Overdue</span>
                    </div>
                    <Badge className="bg-red-500">{stats.overdueCount}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Average Invoice Value</span>
                    <span className="font-medium">
                      {InvoiceCalculator.formatCurrency(stats.averageInvoiceValue)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Payment Rate</span>
                    <span className="font-medium">{stats.paymentRate.toFixed(1)}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Total Invoices</span>
                    <span className="font-medium">{stats.totalInvoices}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Outstanding Amount</span>
                    <span className="font-medium text-red-600">
                      {InvoiceCalculator.formatCurrency(stats.pendingAmount + stats.overdueAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Invoices</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('invoices')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentInvoices.length > 0 ? (
                <div className="space-y-4">
                  {recentInvoices.slice(0, 5).map((invoice) => {
                    const calculations = InvoiceCalculator.calculateInvoice(invoice)
                    return (
                      <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{invoice.invoiceNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {invoice.clientName || 'Unknown Client'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">
                              {InvoiceCalculator.formatCurrency(calculations.total, invoice.currency)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Due: {new Date(invoice.dueDate).toLocaleDateString()}
                            </p>
                          </div>

                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </Badge>

                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditInvoice(invoice)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No invoices found</p>
                  <Button onClick={handleCreateInvoice} className="mt-4">
                    Create your first invoice
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <EnhancedInvoiceManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Revenue Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Revenue analytics coming soon</p>
                    <p className="text-sm">Track your revenue trends over time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Client Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Client analytics coming soon</p>
                    <p className="text-sm">Analyze client payment patterns</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Invoice Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Invoice settings coming soon</p>
                  <p className="text-sm">Configure default templates, tax rates, and more</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}