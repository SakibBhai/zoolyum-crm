import { type NextRequest, NextResponse } from "next/server"
import { invoicesService } from "@/lib/neon-db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await invoicesService.getById(params.id)
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }
    return NextResponse.json(invoice)
  } catch (error) {
    console.error("Error in GET /api/invoices/[id]:", error)
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const updatedInvoice = await invoicesService.update(params.id, body)
    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error("Error in PUT /api/invoices/[id]:", error)
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await invoicesService.delete(params.id)
    return NextResponse.json({ message: "Invoice deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/invoices/[id]:", error)
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 })
  }
}
