'use server'

import { NextRequest } from 'next/server'
import { getApiBaseUrl } from '@/api/models/constants'
import jwt from 'jsonwebtoken'

export const generateJWTToken = async (username: string): Promise<string> => {
  const secret = process.env.JWT_SECRET || 'default-secret-key'
  
  // Create the payload exactly as the server expects it
  const payload = {
    username,
    scopes: ['admin'],
    sub: username,
  }
  
  // Use the jwt.sign function directly - it's synchronous
  try {
    const token = jwt.sign(payload, secret)
    return token
  } catch (error) {
    console.error('Error signing JWT token:', error)
    throw error
  }
}

// Updated to be synchronous as well
export const addAuthHeader = async (username: string): Promise<NextRequest> => {
  const request = new NextRequest(new URL(getApiBaseUrl()))
  const token = await generateJWTToken(username)
  request.headers.set('Authorization', `Bearer ${token}`)
  return request
}
