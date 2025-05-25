import { Request, Response, NextFunction, ErrorRequestHandler } from 'express'
import { ApiErrorModel } from '@/models/contract/ApiErrorModel'
import { ValidateError } from 'tsoa'

/**
 * Error handler middleware
 * Converts all errors to ApiErrorModel format
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ValidateError) {
    // Handle validation errors from TSOA
    const apiError = new ApiErrorModel(
      400,
      'Validation Failed',
      'VALIDATION_ERROR',
      {
        fields: JSON.stringify(err.fields),
      },
    )
    res.status(400).json(apiError)
    return
  }

  if (err instanceof Error) {
    // Determine status code from the Error name if possible
    let status = 500
    let code = 'INTERNAL_SERVER_ERROR'

    if (err.name === 'UnauthorizedError' || err.message.includes('No token provided')) {
      status = 401
      code = 'UNAUTHORIZED'
    } else if (err.message.includes('not found') || err.message.includes('Not found')) {
      status = 404
      code = 'NOT_FOUND'
    } else if (err.message.includes('already exists') || err.message.includes('required')) {
      status = 400
      code = 'BAD_REQUEST'
    } else if (err.message.includes('forbidden') || err.message.includes('not allowed')) {
      status = 403
      code = 'FORBIDDEN'
    }

    const details = process.env.NODE_ENV === 'development' 
      ? {
        stack: err.stack || '',
        name: err.name,
      } 
      : undefined

    const apiError = new ApiErrorModel(
      status,
      err.message,
      code,
      details,
    )

    res.status(status).json(apiError)
    return
  }

  // Unknown error
  const apiError = new ApiErrorModel(
    500,
    'An unexpected error occurred',
    'INTERNAL_SERVER_ERROR',
  )
  
  res.status(500).json(apiError)
} 