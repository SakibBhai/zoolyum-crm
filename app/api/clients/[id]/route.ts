import { type NextRequest, NextResponse } from "next/server"
import { clientsService } from "@/lib/neon-db"

export async function GET(request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  try {
    const params = await paramsPromise;
    const client = await clientsService.getById(params.id)
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    return NextResponse.json(client)
  } catch (error) {
    console.error("Error in GET /api/clients/[id]:", error)
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  try {
    const params = await paramsPromise;
    const body = await request.json()
    const updatedClient = await clientsService.update(params.id, body)
    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error("Error in PUT /api/clients/[id]:", error)
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  try {
    const params = await paramsPromise;
    await clientsService.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/clients/[id]:", error)
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 })
  }
}
