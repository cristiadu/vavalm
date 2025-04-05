"use client"

import { useEffect } from 'react'
import { getApiBaseUrl } from '@/api/models/constants'
import { generateJWTToken } from '@/api/JWTSigning'

/**
 * A client component that provides authentication for the entire app
 * This component doesn't render anything, but it sets up the fetch interceptor
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run this code in the browser
    if (typeof window === 'undefined') return
    
    console.log('Setting up fetch interceptor')
    
    // Store the original fetch function
    const originalFetch = typeof window !== 'undefined' ? window.fetch : fetch
    
    // Override the fetch function
    window.fetch = async (resource, init) => {
      const url = resource instanceof Request ? resource.url : resource
      
      // Only modify API requests
      if (typeof url === 'string' && url.startsWith(getApiBaseUrl())) {
        try {
          console.log('This is an API request, adding JWT token')
          
          // Generate JWT token using the JWTSigning class (now synchronous)
          const token = await generateJWTToken('admin')
          console.log('Generated token:', token.substring(0, 20) + '...')
          
          // Add the token to the request headers
          const headers = new Headers(init?.headers)
          headers.set('Authorization', `Bearer ${token}`)
          
          // Make the request with the modified headers
          return originalFetch(resource, {
            ...init,
            headers,
          })
        } catch (error) {
          console.error('Error adding JWT token:', error)
          // Fall back to regular fetch if there's an error
          return originalFetch(resource, init)
        }
      }
      
      // For non-API requests, use the original fetch
      return originalFetch(resource, init)
    }
    
    console.log('Fetch interceptor setup complete')
    
    // Clean up function to restore the original fetch
    return () => {
      window.fetch = originalFetch
    }
  }, [])
  
  // This component doesn't render anything
  return <>{children}</>
} 