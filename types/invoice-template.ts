export interface InvoiceTemplate {
  id: string
  name: string
  description?: string
  isDefault: boolean
  isActive: boolean
  
  // Design settings
  design: {
    colorScheme: {
      primary: string
      secondary: string
      accent: string
      text: string
      background: string
    }
    layout: 'modern' | 'classic' | 'minimal' | 'professional'
    fontSize: 'small' | 'medium' | 'large'
    spacing: 'compact' | 'normal' | 'spacious'
  }
  
  // Company branding
  branding: {
    companyName: string
    logo?: {
      url: string
      width: number
      height: number
      position: 'left' | 'center' | 'right'
    }
    address: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
    }
    contact: {
      email: string
      phone?: string
      website?: string
    }
    taxId?: string
    registrationNumber?: string
  }
  
  // Invoice settings
  settings: {
    showLineNumbers: boolean
    showTaskIds: boolean
    showProjectInfo: boolean
    showPaymentTerms: boolean
    showNotes: boolean
    showTaxBreakdown: boolean
    showDiscountDetails: boolean
    showShipping: boolean
    currency: string
    currencySymbol: string
    dateFormat: string
    numberFormat: string
    
    // Default values
    defaultPaymentTerms: string
    defaultNotes: string
    defaultTaxRate: number
    defaultDueDays: number
  }
  
  // Email settings
  emailSettings: {
    subject: string
    body: string
    attachPdf: boolean
    sendCopy: boolean
    copyEmail?: string
  }
  
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface InvoiceTemplateFormData {
  name: string
  description?: string
  design: InvoiceTemplate['design']
  branding: InvoiceTemplate['branding']
  settings: InvoiceTemplate['settings']
  emailSettings: InvoiceTemplate['emailSettings']
}

export const DEFAULT_INVOICE_TEMPLATE: Omit<InvoiceTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
  name: 'Default Template',
  description: 'Standard invoice template',
  isDefault: true,
  isActive: true,
  design: {
    colorScheme: {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#0ea5e9',
      text: '#1e293b',
      background: '#ffffff'
    },
    layout: 'professional',
    fontSize: 'medium',
    spacing: 'normal'
  },
  branding: {
    companyName: 'Your Company Name',
    address: {
      street: '123 Business Street',
      city: 'City',
      state: 'State',
      zipCode: '12345',
      country: 'Country'
    },
    contact: {
      email: 'contact@yourcompany.com',
      phone: '+1 (555) 123-4567',
      website: 'www.yourcompany.com'
    }
  },
  settings: {
    showLineNumbers: true,
    showTaskIds: false,
    showProjectInfo: true,
    showPaymentTerms: true,
    showNotes: true,
    showTaxBreakdown: true,
    showDiscountDetails: true,
    showShipping: false,
    currency: 'USD',
    currencySymbol: '$',
    dateFormat: 'MM/dd/yyyy',
    numberFormat: 'en-US',
    defaultPaymentTerms: 'Payment due within 30 days',
    defaultNotes: 'Thank you for your business!',
    defaultTaxRate: 10,
    defaultDueDays: 30
  },
  emailSettings: {
    subject: 'Invoice #{invoiceNumber} from {companyName}',
    body: 'Dear {clientName},\n\nPlease find attached invoice #{invoiceNumber} for the amount of {total}.\n\nThank you for your business!\n\nBest regards,\n{companyName}',
    attachPdf: true,
    sendCopy: false
  }
}