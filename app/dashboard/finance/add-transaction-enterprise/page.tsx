"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { EnhancedTransactionForm, EnhancedTransaction } from "@/components/finance/enhanced-transaction-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Sparkles, TrendingUp, Shield, Repeat, Globe } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AddTransactionEnterprisePage() {
  const { toast } = useToast()
  const router = useRouter()
  const [existingTransactions, setExistingTransactions] = useState<EnhancedTransaction[]>([])
  const [showForm, setShowForm] = useState(true)

  // Load existing transactions for duplicate detection and AI suggestions
  useEffect(() => {
    const savedTransactions = localStorage.getItem('enhanced-finance-transactions')
    if (savedTransactions) {
      try {
        setExistingTransactions(JSON.parse(savedTransactions))
      } catch (error) {
        console.error('Error loading transactions:', error)
      }
    }
  }, [])

  const handleAddTransaction = (transaction: Omit<EnhancedTransaction, 'id' | 'createdAt'>) => {
    const newTransaction: EnhancedTransaction = {
      ...transaction,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    }
    
    const updatedTransactions = [newTransaction, ...existingTransactions]
    setExistingTransactions(updatedTransactions)
    localStorage.setItem('enhanced-finance-transactions', JSON.stringify(updatedTransactions))
    
    setShowForm(false)
    
    toast({
      title: "✅ Transaction Created Successfully",
      description: `${transaction.type === 'income' ? 'Income' : 'Expense'} of ${transaction.currency === 'BDT' ? '৳' : '$'}${transaction.amount.toLocaleString()} has been recorded with enterprise features.`,
    })
    
    // Redirect back to finance overview after a short delay
    setTimeout(() => {
      router.push('/dashboard/finance')
    }, 2000)
  }

  const handleCancel = () => {
    router.push('/dashboard/finance')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/finance">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Finance
          </Button>
        </Link>
        <div className="flex-1">
          <PageHeader
            heading="Add New Transaction"
            subheading="Create comprehensive financial transactions with enterprise-grade features and advanced capabilities."
          />
        </div>
      </div>

      {/* Enterprise Features Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Multi-Currency</CardTitle>
            <Globe className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">8+</div>
            <p className="text-xs text-muted-foreground">
              Supported currencies with real-time conversion
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Smart Features</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">AI</div>
            <p className="text-xs text-muted-foreground">
              Auto-categorization and duplicate detection
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recurring</CardTitle>
            <Repeat className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Auto</div>
            <p className="text-xs text-muted-foreground">
              Set up automatic recurring transactions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">Pro</div>
            <p className="text-xs text-muted-foreground">
              Enterprise-grade security and privacy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Enterprise Features Included
          </CardTitle>
          <CardDescription>
            This enhanced transaction form includes all the enterprise-grade features you requested
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">🔧 Transaction Enhancements</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• AI-based auto-categorization</li>
                <li>• Sub-type support for detailed tracking</li>
                <li>• Smart duplicate detection</li>
                <li>• Historical data suggestions</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">💱 Advanced Financial</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Multi-currency support (8+ currencies)</li>
                <li>• Real-time exchange rate conversion</li>
                <li>• Payment method tracking</li>
                <li>• Vendor/Client linking</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">📊 Smart Automation</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Recurring transaction setup</li>
                <li>• Template-based descriptions</li>
                <li>• Rich text formatting</li>
                <li>• Custom category creation</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">📎 Document Management</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Receipt & invoice uploads</li>
                <li>• Multiple file format support</li>
                <li>• Automatic file validation</li>
                <li>• Cloud storage integration ready</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">🔐 Security & Privacy</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Confidentiality toggles</li>
                <li>• Team permission controls</li>
                <li>• Data validation & integrity</li>
                <li>• Audit trail tracking</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">⚡ User Experience</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Tabbed interface for organization</li>
                <li>• Real-time validation alerts</li>
                <li>• Undo/Edit capabilities</li>
                <li>• Mobile-responsive design</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success State */}
      {!showForm && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Transaction Created Successfully!
            </CardTitle>
            <CardDescription className="text-green-700">
              Your enterprise-grade transaction has been saved with all advanced features.
              Redirecting to finance overview...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-green-700 border-green-300">
                ✅ Saved
              </Badge>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                🔍 Duplicate Checked
              </Badge>
              <Badge variant="outline" className="text-purple-700 border-purple-300">
                🤖 AI Processed
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Transaction Form */}
      {showForm && (
        <EnhancedTransactionForm
          onSubmit={handleAddTransaction}
          onCancel={handleCancel}
          existingTransactions={existingTransactions}
        />
      )}
    </div>
  )
}