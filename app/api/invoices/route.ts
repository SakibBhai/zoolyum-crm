import { type NextRequest, NextResponse } from "next/server"
import { invoicesService } from "@/lib/neon-db"

export async function GET() {
  try {
    const invoices = await invoicesService.getAll()
    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Error in GET /api/invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newInvoice = await invoicesService.create(body)
    return NextResponse.json(newInvoice, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/invoices:", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}
