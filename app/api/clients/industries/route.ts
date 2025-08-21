import { NextResponse } from "next/server"
import { clientsService } from "@/lib/neon-db"

export async function GET() {
  try {
    const industries = await clientsService.getIndustries()
    const response = NextResponse.json(industries)
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    return response
  } catch (error) {
    console.error("Error in GET /api/clients/industries:", error)
    const errorResponse = NextResponse.json(
      { error: "Failed to fetch client industries" }, 
      { status: 500 }
    )
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return errorResponse
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}
