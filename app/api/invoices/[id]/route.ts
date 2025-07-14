import { type NextRequest, NextResponse } from "next/server"
import { invoicesService } from "@/lib/neon-db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await invoicesService.getById(id)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const updatedInvoice = await invoicesService.update(id, body)
    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error("Error in PUT /api/invoices/[id]:", error)
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await invoicesService.delete(id)
    return NextResponse.json({ message: "Invoice deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/invoices/[id]:", error)
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 })
  }
}
