import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

interface JWTPayload {
  userId: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export function verifyToken(token: string): JWTPayload {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  
  try {
    const decoded = jwt.verify(token, secret) as JWTPayload
    return decoded
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export function extractUserIdFromRequest(request: NextRequest): string {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header')
  }
  
  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  const payload = verifyToken(token)
  
  if (!payload.userId) {
    throw new Error('Invalid token payload: missing userId')
  }
  
  return payload.userId
}