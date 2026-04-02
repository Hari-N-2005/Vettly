import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/authService'

export interface AuthRequest extends Request {
  userId?: string
  email?: string
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] // Bearer <token>

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = authService.verifyToken(token)

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.userId = decoded.userId
    req.email = decoded.email

    next()
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' })
  }
}
