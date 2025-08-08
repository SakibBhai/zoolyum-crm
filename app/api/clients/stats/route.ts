import { NextResponse } from "next/server"
import { clientsService } from "@/lib/neon-db"

export async function GET() {
  try {
    const stats = await clientsService.getClientStats()
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error in GET /api/clients/stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch client statistics" }, 
      { status: 500 }
    )
  }
}
