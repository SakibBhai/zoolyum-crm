# MVC Architecture for Zoolyum CRM

## Overview
This document defines the Model-View-Controller (MVC) architecture for the Zoolyum CRM application, built with Next.js 15, TypeScript, and PostgreSQL.

## Architecture Pattern

### Model-View-Controller (MVC) Structure
```
┌─────────────────────────────────────────────────┐
│                    VIEW LAYER                   │
├─────────────────────────────────────────────────┤
│ • React Components (UI/Components)              │
│ • Pages (App Router)                            │
│ • Client-side State Management (Contexts)       │
│ • Form Handling & Validation                    │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│                 CONTROLLER LAYER                │
├─────────────────────────────────────────────────┤
│ • API Routes (Next.js API Handlers)             │
│ • Request/Response Processing                   │
│ • Authentication & Authorization               │
│ • Input Validation & Sanitization             │
│ • Business Logic Orchestration                │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│                   MODEL LAYER                   │
├─────────────────────────────────────────────────┤
│ • Database Services (lib/neon-db.ts)           │
│ • Data Access Layer (DAL)                      │
│ • Database Schema (PostgreSQL)                 │
│ • Type Definitions (TypeScript)                │
│ • Business Rules & Validation                  │
└─────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── app/                          # Next.js App Router (VIEW & CONTROLLER)
│   ├── api/                     # CONTROLLER: API Routes
│   │   ├── clients/             # Client management endpoints
│   │   ├── projects/            # Project management endpoints
│   │   ├── tasks/               # Task management endpoints
│   │   ├── team/                # Team management endpoints
│   │   ├── invoices/            # Invoice management endpoints
│   │   ├── leads/               # Lead management endpoints
│   │   └── transactions/        # Financial transaction endpoints
│   ├── dashboard/               # VIEW: Dashboard pages
│   └── globals.css              # Global styles
├── components/                   # VIEW: Reusable UI Components
│   ├── ui/                      # Base UI components (shadcn/ui)
│   ├── clients/                 # Client-specific components
│   ├── projects/                # Project-specific components
│   ├── tasks/                   # Task-specific components
│   ├── team/                    # Team-specific components
│   ├── invoices/                # Invoice-specific components
│   ├── leads/                   # Lead-specific components
│   └── finance/                 # Financial components
├── contexts/                     # VIEW: Client-side State Management
│   ├── project-context.tsx      # Project state management
│   ├── task-context.tsx         # Task state management
│   ├── invoice-context.tsx      # Invoice state management
│   └── recurring-invoice-context.tsx
├── lib/                          # MODEL: Data Access & Business Logic
│   ├── neon-db.ts               # Database service layer
│   ├── database.ts              # Database connection
│   ├── auth.ts                  # Authentication logic
│   ├── utils.ts                 # Utility functions
│   └── services/                # Business logic services
├── types/                        # MODEL: Type Definitions
│   ├── project.ts               # Project types
│   ├── task.ts                  # Task types
│   ├── team.ts                  # Team types
│   ├── invoice.ts               # Invoice types
│   └── invoice-template.ts      # Invoice template types
├── hooks/                        # VIEW: Custom React Hooks
│   ├── use-toast.ts             # Toast notifications
│   ├── use-mobile.tsx           # Mobile detection
│   └── use-leads.ts             # Lead management hooks
├── database/                     # MODEL: Database Schema
│   └── schema/                  # SQL schema files
└── prisma/                      # MODEL: Database Schema & Migrations
    ├── schema.prisma            # Prisma schema
    └── migrations/              # Database migrations
```

## Layer Responsibilities

### 1. MODEL Layer (Data & Business Logic)

#### Database Services (`lib/neon-db.ts`)
```typescript
// Example: Client service
export const clientsService = {
  async getAll(filters?: ClientFilters): Promise<Client[]> {
    // Database query logic
  },
  
  async getById(id: string): Promise<Client | null> {
    // Single client retrieval
  },
  
  async create(data: CreateClientData): Promise<Client> {
    // Client creation with validation
  },
  
  async update(id: string, data: UpdateClientData): Promise<Client> {
    // Client update logic
  },
  
  async delete(id: string): Promise<boolean> {
    // Soft delete implementation
  }
}
```

#### Type Definitions (`types/`)
```typescript
// types/client.ts
export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  industry?: string
  status: 'active' | 'inactive' | 'prospect'
  createdAt: Date
  updatedAt: Date
}

export interface CreateClientData {
  name: string
  email?: string
  phone?: string
  industry?: string
  status?: 'active' | 'inactive' | 'prospect'
}
```

#### Database Schema (`database/schema/`)
```sql
-- database/schema/clients.sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  industry VARCHAR(100),
  status client_status NOT NULL DEFAULT 'prospect',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. CONTROLLER Layer (API Routes)

#### API Route Structure (`app/api/`)
```typescript
// app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { clientsService } from '@/lib/neon-db'
import { z } from 'zod'

const createClientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  status: z.enum(['active', 'inactive', 'prospect']).default('prospect')
})

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const filters = {
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      industry: searchParams.get('industry')
    }
    
    // Call model layer
    const clients = await clientsService.getAll(filters)
    
    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = createClientSchema.parse(body)
    
    // Call model layer
    const client = await clientsService.create(validatedData)
    
    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}
```

### 3. VIEW Layer (Components & Pages)

#### Page Components (`app/dashboard/`)
```typescript
// app/dashboard/clients/page.tsx
import { ClientsTable } from '@/components/clients/clients-table'
import { PageHeader } from '@/components/page-header'

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Clients" 
        description="Manage your client relationships"
      />
      <ClientsTable />
    </div>
  )
}
```

#### UI Components (`components/`)
```typescript
// components/clients/clients-table.tsx
'use client'

import { useState, useEffect } from 'react'
import { Client } from '@/types/client'

export function ClientsTable() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchClients()
  }, [])
  
  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-4">
      {/* Table implementation */}
    </div>
  )
}
```

#### Context Providers (`contexts/`)
```typescript
// contexts/client-context.tsx
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { Client } from '@/types/client'

interface ClientContextType {
  clients: Client[]
  loading: boolean
  addClient: (client: Omit<Client, 'id'>) => Promise<void>
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>
  deleteClient: (id: string) => Promise<void>
  refreshClients: () => Promise<void>
}

const ClientContext = createContext<ClientContextType | undefined>(undefined)

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  
  // Context implementation
  
  return (
    <ClientContext.Provider value={contextValue}>
      {children}
    </ClientContext.Provider>
  )
}

export function useClientContext() {
  const context = useContext(ClientContext)
  if (!context) {
    throw new Error('useClientContext must be used within ClientProvider')
  }
  return context
}
```

## Data Flow

### 1. Create Operation Flow
```
User Input (Form) → Component → Context → API Route → Service → Database
                                  ↓
User Feedback ← Component ← Context ← API Response ← Service ← Database
```

### 2. Read Operation Flow
```
Component Mount → Context → API Route → Service → Database
                     ↓
Component Update ← Context ← API Response ← Service ← Database
```

### 3. Update Operation Flow
```
User Action → Component → Context → API Route → Service → Database
                 ↓
State Update ← Component ← Context ← API Response ← Service ← Database
```

### 4. Delete Operation Flow
```
User Confirmation → Component → Context → API Route → Service → Database
                       ↓
State Update ← Component ← Context ← API Response ← Service ← Database
```

## Best Practices

### Model Layer
- **Single Responsibility**: Each service handles one entity type
- **Data Validation**: Validate data at the model layer
- **Error Handling**: Proper error handling with meaningful messages
- **Type Safety**: Strong TypeScript typing for all data operations
- **Database Optimization**: Efficient queries with proper indexing

### Controller Layer
- **Input Validation**: Validate all incoming requests using Zod
- **Authentication**: Implement proper authentication and authorization
- **Error Handling**: Standardized error responses
- **Logging**: Comprehensive logging for debugging and monitoring
- **Rate Limiting**: Implement rate limiting for API endpoints

### View Layer
- **Component Composition**: Small, focused, reusable components
- **State Management**: Use React Context for global state
- **Performance**: Optimize re-renders with useMemo and useCallback
- **Accessibility**: Implement proper ARIA labels and keyboard navigation
- **Responsive Design**: Mobile-first responsive design

## Security Considerations

### Authentication & Authorization
```typescript
// lib/auth.ts
export async function authenticateUser(token: string): Promise<User | null> {
  // JWT validation logic
}

export async function authorizeAction(
  userId: string, 
  resource: string, 
  action: string
): Promise<boolean> {
  // Permission checking logic
}
```

### Input Validation
```typescript
// All API routes use Zod validation
const createProjectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  budget: z.number().positive().optional(),
  clientId: z.string().uuid()
})
```

### SQL Injection Prevention
```typescript
// Using parameterized queries with Neon
const client = await sql`
  SELECT * FROM clients 
  WHERE id = ${clientId} AND user_id = ${userId}
`
```

## Performance Optimization

### Database Layer
- **Connection Pooling**: Neon provides built-in connection pooling
- **Query Optimization**: Efficient queries with proper indexing
- **Caching**: Implement Redis caching for frequently accessed data
- **Pagination**: Implement pagination for large data sets

### API Layer
- **Response Compression**: Enable gzip compression
- **Caching Headers**: Set appropriate cache headers
- **Rate Limiting**: Implement rate limiting to prevent abuse
- **Background Jobs**: Use background processing for heavy operations

### Client Layer
- **Code Splitting**: Dynamic imports for route-based splitting
- **Image Optimization**: Next.js Image component for optimized images
- **Lazy Loading**: Lazy load components and data
- **Memoization**: Use React.memo and useMemo appropriately

## Testing Strategy

### Model Layer Testing
```typescript
// tests/services/clients.test.ts
describe('ClientsService', () => {
  it('should create a client with valid data', async () => {
    const clientData = {
      name: 'Test Client',
      email: 'test@example.com',
      industry: 'Technology'
    }
    
    const client = await clientsService.create(clientData)
    
    expect(client.id).toBeDefined()
    expect(client.name).toBe('Test Client')
  })
})
```

### Controller Layer Testing
```typescript
// tests/api/clients.test.ts
describe('/api/clients', () => {
  it('should return clients list', async () => {
    const response = await request(app)
      .get('/api/clients')
      .expect(200)
    
    expect(response.body).toBeInstanceOf(Array)
  })
})
```

### View Layer Testing
```typescript
// tests/components/clients-table.test.tsx
describe('ClientsTable', () => {
  it('should render client data', () => {
    const mockClients = [
      { id: '1', name: 'Test Client', email: 'test@example.com' }
    ]
    
    render(<ClientsTable clients={mockClients} />)
    
    expect(screen.getByText('Test Client')).toBeInTheDocument()
  })
})
```

## Deployment Architecture

### Environment Configuration
```bash
# Production
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
NEXTAUTH_SECRET="production-secret"
NEXTAUTH_URL="https://your-app.vercel.app"

# Development  
DATABASE_URL="postgresql://user:pass@localhost/db_dev"
NEXTAUTH_SECRET="dev-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### CI/CD Pipeline
1. **Code Quality**: ESLint, Prettier, TypeScript checks
2. **Testing**: Unit tests, integration tests, e2e tests
3. **Build**: Next.js build with optimizations
4. **Database**: Migration and seeding
5. **Deployment**: Vercel deployment with environment variables

## Monitoring & Logging

### Application Monitoring
- **Error Tracking**: Sentry for error monitoring
- **Performance**: Vercel Analytics for performance metrics
- **Uptime**: Uptime monitoring for API endpoints
- **Database**: Neon dashboard for database metrics

### Logging Strategy
```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({ level: 'info', message, meta, timestamp: new Date().toISOString() }))
  },
  error: (message: string, error?: Error) => {
    console.error(JSON.stringify({ level: 'error', message, error: error?.message, timestamp: new Date().toISOString() }))
  }
}
```

## Maintenance & Updates

### Database Migrations
```sql
-- migrations/001_add_client_tags.sql
ALTER TABLE clients ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
CREATE INDEX idx_clients_tags ON clients USING gin(tags);
```

### Version Control
- **Semantic Versioning**: Use semantic versioning for releases
- **Feature Branches**: Use feature branches for new development
- **Code Reviews**: Mandatory code reviews for all changes
- **Documentation**: Update documentation with code changes

This MVC architecture provides a solid foundation for the Zoolyum CRM application, ensuring scalability, maintainability, and performance while following Next.js best practices.
