import { NextResponse } from "next/server"
import { clientsService } from "@/lib/neon-db"

export async function GET() {
  try {
    const industries = await clientsService.getIndustries()
    
    return NextResponse.json(industries)
  } catch (error) {
    console.error("Error in GET /api/clients/industries:", error)
    return NextResponse.json(
      { error: "Failed to fetch client industries" }, 
      { status: 500 }
    )
  }
}
