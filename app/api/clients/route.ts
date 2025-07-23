import { type NextRequest, NextResponse } from "next/server"
import { clientsService } from "@/lib/neon-db"
import { z } from "zod"

// Validation schema for client creation
const createClientSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters"),
  industry: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  status: z.enum(["active", "inactive", "prospect"]).default("active"),
  notes: z.string().optional(),
})

// Query parameters schema
const querySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1') || 1),
  limit: z.string().optional().transform(val => Math.min(parseInt(val || '10') || 10, 100)),
  search: z.string().optional(),
  status: z.enum(["active", "inactive", "prospect", "all"]).optional(),
  industry: z.string().optional(),
  sortBy: z.enum(["name", "created_at", "updated_at", "industry"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validate query parameters
    const validatedParams = querySchema.parse(queryParams)

    const result = await clientsService.getAllPaginated(validatedParams)

    return NextResponse.json({
      clients: result.clients,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / validatedParams.limit),
        hasNext: validatedParams.page < Math.ceil(result.total / validatedParams.limit),
        hasPrev: validatedParams.page > 1,
      },
      filters: {
        search: validatedParams.search,
        status: validatedParams.status,
        industry: validatedParams.industry,
        sortBy: validatedParams.sortBy,
        sortOrder: validatedParams.sortOrder,
      }
    })
  } catch (error) {
    console.error("Error in GET /api/clients:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Invalid query parameters",
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = createClientSchema.parse(body)

    const newClient = await clientsService.create(validatedData)

    return NextResponse.json({
      client: newClient,
      message: "Client created successfully"
    }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/clients:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Validation failed",
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}
