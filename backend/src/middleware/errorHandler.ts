import { NextFunction, Request, Response } from 'express'

export interface AuthRequest extends Request {
  userId?: string
  email?: string
}

/**
 * Error handling middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err)

  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  res.status(statusCode).json({
    error: {
      message,
      code: err.code,
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * Async route wrapper to catch errors
 */
export const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }

/**
 * Validation error middleware
 */
export const validationErrorHandler = (
  errors: any[],
  req: Request,
  res: Response
) => {
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.map(e => ({
        field: e.path,
        message: e.msg,
      })),
    })
  }
}
