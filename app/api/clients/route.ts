import { type NextRequest, NextResponse } from "next/server"
import { clientsService } from "@/lib/neon-db"

export async function GET() {
  try {
    const clients = await clientsService.getAll()
    return NextResponse.json(clients)
  } catch (error) {
    console.error("Error in GET /api/clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newClient = await clientsService.create(body)
    return NextResponse.json(newClient, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/clients:", error)
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}
