import { Request, Response, NextFunction, ErrorRequestHandler } from 'express'
import { ErrorApiModel } from '@/models/contract/ErrorApiModel'
import { ValidateError } from 'tsoa'
import { UniqueConstraintError, ValidationError as SequelizeValidationError } from 'sequelize'

/**
 * Error handler middleware
 * Converts all errors to ErrorApiModel format
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ValidateError) {
    // Handle validation errors from TSOA
    const apiError = new ErrorApiModel(
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

  if (err instanceof UniqueConstraintError) {
    // Sequelize unique constraint violation — a duplicate record was attempted
    const fields = err.errors.map(e => e.path).join(', ')
    const apiError = new ErrorApiModel(
      422,
      `Duplicate value for field(s): ${fields}`,
      'DUPLICATE_ENTRY',
    )
    res.status(422).json(apiError)
    return
  }

  if (err instanceof SequelizeValidationError) {
    // Sequelize model validation failed
    const messages = err.errors.map(e => e.message).join('; ')
    const apiError = new ErrorApiModel(400, messages, 'VALIDATION_ERROR')
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

    const apiError = new ErrorApiModel(
      status,
      err.message,
      code,
      details,
    )

    res.status(status).json(apiError)
    return
  }

  // Unknown error
  const apiError = new ErrorApiModel(
    500,
    'An unexpected error occurred',
    'INTERNAL_SERVER_ERROR',
  )
  
  res.status(500).json(apiError)
} 